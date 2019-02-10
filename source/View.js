import Model from './Model';

import {
    parseDOM,
    scanTemplate,
    stringifyDOM,
    attributeMap,
    nextTick
} from './utility';

import Template from './Template';

const { forEach, push } = Array.prototype;

const iterator = [][Symbol.iterator];

const view_template = Symbol('View template'),
    view_top = new WeakMap(),
    view_injection = Symbol('View injection'),
    view_varible = ['view', 'scope'],
    element_view = new WeakMap();

export default class View extends Model {
    /**
     * @param {String}  template
     * @param {?Object} scope          - Data of parent View
     * @param {Object}  [injection={}] - Key for Template varible
     */
    constructor(template, scope, injection = {}) {
        super(scope);

        (this[view_template] = template + ''),
        (this[view_injection] = injection);

        const top = [];

        view_top.set(this, top);

        forEach.call(parseDOM(template).childNodes, node => {
            top.push(node);

            if (node.nodeType === 1) this.parseTree(node);
        });

        Object.freeze(top);
    }

    [Symbol.iterator]() {
        return iterator.call(this);
    }

    /**
     * @type {Node[]}
     */
    get topNodes() {
        return view_top.get(this);
    }

    /**
     * @return {String} HTML/XML source code of this View
     */
    toString() {
        return stringifyDOM(this.topNodes);
    }

    /**
     * @return {View}
     */
    clone() {
        return new View(this[view_template], this.scope, this[view_injection]);
    }

    /**
     * @param {HTMLElement} root
     *
     * @return {String}
     */
    static getTemplate(root) {
        for (let node of root.childNodes)
            if (node.nodeName.toLowerCase() === 'template')
                return node.innerHTML;
            else if (node.nodeType === 8) return node.nodeValue;

        const raw = root.innerHTML;

        return (root.innerHTML = '') || raw;
    }

    /**
     * @protected
     *
     * @param {String}        type
     * @param {Element}       element
     * @param {Template|View} renderer
     */
    addNode(type, element, renderer) {
        const name = element.dataset.view;

        push.call(this, { type, element, renderer, name });

        if (type !== 'View') return;

        const sub_view = [];

        element_view.set(element, sub_view);

        if (!(name in this))
            Object.defineProperty(this, name, {
                get: () => (sub_view[1] ? sub_view : sub_view[0]),
                enumerable: true
            });
    }

    /**
     * @protected
     *
     * @param {Element} root
     */
    parseTree(root) {
        const injection = view_varible.concat(
            Object.keys(this[view_injection])
        );

        scanTemplate(root, Template.Expression, '[data-view]', {
            attribute: ({ ownerElement, name, value }) => {
                name = attributeMap[name] || name;

                this.addNode(
                    'Attr',
                    ownerElement,
                    new Template(
                        value,
                        injection,
                        name in ownerElement
                            ? value => (ownerElement[name] = value)
                            : value => ownerElement.setAttribute(name, value)
                    )
                );
            },
            text: node => {
                const { parentNode } = node;

                this.addNode(
                    'Text',
                    parentNode,
                    new Template(
                        node.nodeValue,
                        injection,
                        parentNode.firstElementChild
                            ? value => (node.nodeValue = value)
                            : value => (parentNode.innerHTML = value)
                    )
                );
            },
            view: node =>
                this.addNode(
                    'View',
                    node,
                    new View(View.getTemplate(node).trim(), this.data)
                )
        });
    }

    /**
     * @param {Object} data
     *
     * @return {View}
     */
    async render(data) {
        data = this.patch(data);

        const injection = [data, this.scope].concat(
            Object.values(this[view_injection])
        );

        forEach.call(this, ({ type, element, renderer }) => {
            if (type !== 'View')
                renderer.evaluate.apply(renderer, [element].concat(injection));
        });

        for (let { type, element, renderer, name } of this)
            if (type === 'View') {
                await nextTick();

                await this.renderSub(data[name], element, renderer);
            }
    }

    destroy() {
        view_top.get(this).forEach(node => node.remove());

        view_top.delete(this);
    }

    /**
     * @protected
     *
     * @param {Object}  data
     * @param {Element} element
     * @param {View}    renderer
     */
    async renderSub(data, element, renderer) {
        if (!data && data !== null) return;

        const sub = element_view.get(element);

        if (!data) {
            sub.forEach(view => view.destroy());

            return (sub.length = 0);
        }

        if (!(data instanceof Array)) data = [data];

        sub.splice(data.length, Infinity).forEach(view => view.destroy());

        for (let i = 0; data[i]; i++) {
            sub[i] = sub[i] || renderer.clone();

            await sub[i].render(data[i]);
        }

        element.append.apply(
            element,
            [].concat.apply([], sub.map(view => view.topNodes))
        );
    }
}
