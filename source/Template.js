const template_raw = Symbol('Template raw'),
    template_scope = Symbol('Template scope'),
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
            [template_value]: null,
            onChange: onChange instanceof Function && onChange
        });

        this.parse(), this.reset();
    }

    valueOf() {
        return this[template_value];
    }

    toString() {
        return this[template_value] + '';
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
            (_, expression) =>
                '${' + (this.push(this.evaluatorOf(expression)) - 1) + '}'
        );
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
            console.warn(error);
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
        var value = this[1]
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
