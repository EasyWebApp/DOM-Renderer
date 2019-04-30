const template_raw = Symbol('Template raw'),
    template_scope = Symbol('Template scope'),
    scope_key = new WeakMap(),
    template_value = Symbol('Template value');

export default class Template extends Array {
    /**
     * @param {String}                           raw
     * @param {String[]}                         [scope=[]] - Names of Scoped varibles
     * @param {function(value: *, old: *): void} onChange
     */
    constructor(raw, scope, onChange) {
        Object.assign(super(), {
            [template_raw]: raw,
            [template_scope]: scope || [],
            onChange: onChange instanceof Function && onChange
        });

        scope_key.set(this, {});

        this.parse(), this.reset();
    }

    valueOf() {
        return this[template_value];
    }

    toString() {
        return this[template_value] != null ? this[template_value] + '' : '';
    }

    /**
     * @param {String} expression - JavaScript expression
     *
     * @return {Function}
     */
    evaluatorOf(expression) {
        return new (Function.bind.apply(
            Function,
            [null].concat(this[template_scope], `return (${expression});`)
        ))();
    }

    /**
     * @private
     */
    parse() {
        this[template_raw] = this[template_raw].replace(
            Template.Expression,
            (_, expression) => {
                expression.replace(Template.Reference, (_, scope, key) => {
                    if (
                        scope !== 'this' &&
                        !this[template_scope].includes(scope)
                    )
                        return;

                    const map = scope_key.get(this);

                    (map[scope] = map[scope] || []).push(key);
                });

                return (
                    '${' + (this.push(this.evaluatorOf(expression)) - 1) + '}'
                );
            }
        );
    }

    /**
     * @param {String} scope - Name of a Scoped varible
     *
     * @return {String[]} Reference keys
     */
    keysOf(scope) {
        const map = scope_key.get(this);

        return scope ? map[scope] : [].concat.apply([], Object.values(map));
    }

    /**
     * @private
     *
     * @param {Number}   index
     * @param {?Object}  context
     * @param {Object[]} [scope=[]]
     *
     * @return {*}
     */
    eval(index, context, scope = []) {
        try {
            let value = this[index].apply(context, scope);

            if (value != null) {
                if (Object(value) instanceof String)
                    try {
                        value = JSON.parse(value);
                    } catch (error) {
                        //
                    }

                return value;
            }
        } catch (error) {
            if (template_value in this) console.warn(error);
        }

        return '';
    }

    /**
     * @param {?Object}   context - `this` in the expression
     * @param {...Object} [scope] - Scoped varible objects
     *
     * @return {*}
     */
    evaluate(context, ...scope) {
        var value =
            this[template_raw] !== '${0}'
                ? this[template_raw].replace(/\$\{(\d+)\}/g, (_, index) =>
                    this.eval(index, context, scope)
                )
                : this.eval(0, context, scope);

        if (this[template_value] !== value) {
            if (this.onChange) this.onChange(value, this[template_value]);

            this[template_value] = value;
        }

        return value;
    }

    /**
     * @return {*} {@link Template#evaluate}
     */
    reset() {
        return this.evaluate.apply(
            this,
            Array(this[template_scope].length + 1).fill({})
        );
    }
}

Template.Expression = /\$\{([^}]+)\}/g;

Template.Reference = /(\w+)(?:\.|\[['"])([^'"]+)/g;
