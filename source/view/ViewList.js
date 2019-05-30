import View from './View';

import { insertableIndexOf } from '../object/array';

import { insertTo, makeNode } from '../DOM/manipulate';

const root_list = new WeakMap(),
    list_root = new WeakMap(),
    template = Symbol('View template'),
    child_offset = Symbol('Child offset');

export default class ViewList extends Array {
    /**
     * @param {Element}  root
     * @param {Object}   scope
     * @param {String[]} injection
     */
    constructor(root, scope, injection) {
        super();

        if (!(root instanceof Element)) return;

        if (root_list.has(root))
            throw ReferenceError(
                'One ViewList can only be bound to one Element'
            );

        root_list.set(root, this), list_root.set(this, root);

        this[template] = [View.getTemplate(root), scope, injection];

        this[child_offset] = View.findTemplate(root) + 1;
    }

    /**
     * @param {Node} node
     *
     * @return {?ViewList}
     */
    static instanceOf(node) {
        do {
            const list = root_list.get(node);

            if (list) return list;
        } while ((node = node.parentNode));
    }

    /**
     * @param {Number} [from=0] - View index
     */
    clear(from = 0) {
        this.splice(from, Infinity).forEach(view => view.destroy());
    }

    set length(value) {
        this.clear(value);
    }

    /**
     * @type {Element}
     */
    get root() {
        return list_root.get(this);
    }

    /**
     * @type {String}
     */
    get name() {
        return this.root.dataset.view;
    }

    /**
     * @type {Object}
     */
    get data() {
        return (this[template][1] || '')[this.name];
    }

    /**
     * @return {String} HTML source
     */
    toString() {
        return this.root.outerHTML.replace(/\s+$/gm, '');
    }

    /**
     * @return {Object[]} JSON data
     */
    valueOf() {
        return Array.from(this, view => view.valueOf());
    }

    /**
     * @param {Object}  item
     * @param {?Number} index
     *
     * @return {View}
     */
    async insert(item, index) {
        index = insertableIndexOf(this, index);

        const view = new View(...this[template]),
            { data } = this;

        this.splice(index, 0, view);

        await view.render(item);

        if (data instanceof Array) data[index] = view.data;
        else if (data) this[template][1][this.name] = view.data;

        const { topNodes } = view;

        insertTo(
            this.root,
            makeNode(topNodes),
            topNodes.length * index + this[child_offset],
            true
        );

        return view;
    }

    /**
     * @param {Object[]} list
     */
    async render(list) {
        this.clear(list.length);

        for (let i = 0; list[i]; i++)
            await (this[i] ? this[i].render(list[i]) : this.insert(list[i], i));
    }
}
