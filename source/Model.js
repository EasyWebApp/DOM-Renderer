const view_data = new WeakMap();

/**
 * @abstract
 */
export default class Model {
    /**
     * @param {Object} parent - Scope of this Model
     */
    constructor(parent) {
        if (this.constructor === Model)
            throw TypeError('Model() is an abstract class');

        view_data.set(this, parent ? Object.setPrototypeOf({}, parent) : {});
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

        for (let key in _data_)
            if (
                _data_.hasOwnProperty(key) &&
                (typeof data[key] === 'object' ||
                    typeof _data_[key] !== 'object')
            )
                update[key] = _data_[key];

        return update;
    }
}
