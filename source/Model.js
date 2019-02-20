import { nextTick } from './utility';

const view_data = new WeakMap(),
    cache_data = Symbol('Cache data'),
    next_tick = Symbol('Next tick');

export default class Model {
    /**
     * @param {Object}                       parent     - Scope of this Model
     * @param {function(data: Object): void} [onCommit] - Async updater (Key in `this` is acceptable)
     */
    constructor(parent, onCommit) {
        view_data.set(this, parent ? Object.setPrototypeOf({}, parent) : {});

        Object.assign(this, {
            [cache_data]: null,
            [next_tick]: null,
            onCommit
        });
    }

    /**
     * @type {Object}
     */
    get data() {
        return view_data.get(this);
    }

    /**
     * @type {Object}
     */
    get scope() {
        return Object.getPrototypeOf(view_data.get(this));
    }

    /**
     * @return {Object}
     */
    valueOf() {
        const { data } = this,
            value = {};

        for (let key in data)
            if (data.hasOwnProperty(key)) value[key] = data[key];

        return value;
    }

    /**
     * @param {Object} data
     *
     * @return {Object}
     */
    patch(data) {
        const _data_ = this.data,
            update = Object.setPrototypeOf({}, this.scope);

        Object.assign(_data_, data);

        for (let key in _data_) {
            if (!_data_.hasOwnProperty(key)) continue;

            if (!(key in this))
                Object.defineProperty(this, key, {
                    get: function() {
                        return this.data[key];
                    },
                    set: function(value) {
                        this.commit(key, value);
                    }
                });

            if (
                typeof data[key] === 'object' ||
                typeof _data_[key] !== 'object'
            )
                update[key] = _data_[key];
        }

        return update;
    }

    /**
     * Async update
     *
     * @param {String} key
     * @param {*}      value
     */
    async commit(key, value) {
        if (this[cache_data] === null)
            (this[cache_data] = {}), (this[next_tick] = nextTick());

        this[cache_data][key] = value;

        await this[next_tick];

        if (this[cache_data] === null) return;

        const data = this[cache_data];

        this[cache_data] = this[next_tick] = null;

        var { onCommit } = this;

        onCommit = onCommit instanceof Function ? onCommit : this[onCommit];

        await onCommit.call(this, data);
    }
}
