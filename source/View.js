import Model from './Model';

import { parseDOM, scanTemplate, stringifyDOM, attributeMap } from './utility';

import Template from './Template';

const { forEach, push } = Array.prototype;

const view_template = Symbol('View template'),
    view_top = new Map(),
    view_injection = Symbol('View injection'),
    view_varible = ['view', 'scope'];

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

        forEach.call(parseDOM(template).childNodes, node => {
            view_top.set(node, this);

            if (node.nodeType === 1) this.parseTree(node);
        });
    }

    /**
     * @type {Node[]}
     */
    get topNodes() {
        const list = [];

        view_top.forEach((view, node) => view === this && list.push(node));

        return list;
    }

    /**
     * @return {String} HTML/XML source code of this View
     */
    toString() {
        return stringifyDOM(this.topNodes);
    }

    /**
     * @param {Element} root
     */
    static clear(root) {
        Array.from(view_top.keys())
            .filter(node => root.compareDocumentPosition(node) & 16)
            .forEach(node => (view_top.delete(node), node.remove()));
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
     * @param {Element} root
     */
    parseTree(root) {
        const injection = view_varible.concat(
            Object.keys(this[view_injection])
        );

        scanTemplate(root, Template.Expression, '[data-view]', {
            attribute: ({ ownerElement, name, value }) => {
                name = attributeMap[name] || name;

                push.call(this, {
                    type: 'Attr',
                    element: ownerElement,
                    renderer: new Template(
                        value,
                        injection,
                        name in ownerElement
                            ? value => (ownerElement[name] = value)
                            : value => ownerElement.setAttribute(name, value)
                    )
                });
            },
            text: node => {
                const { parentNode } = node;

                push.call(this, {
                    type: 'Text',
                    element: parentNode,
                    renderer: new Template(
                        node.nodeValue,
                        injection,
                        parentNode.firstElementChild
                            ? value => (node.nodeValue = value)
                            : value => (parentNode.innerHTML = value)
                    )
                });
            },
            view: node =>
                push.call(this, {
                    type: 'View',
                    element: node,
                    renderer: new View(View.getTemplate(node).trim(), this.data)
                })
        });
    }

    /**
     * @param {Object} data
     *
     * @return {View}
     */
    render(data) {
        data = this.patch(data);

        const injection = [data, this.scope].concat(
            Object.values(this[view_injection])
        );

        forEach.call(this, ({ type, element, renderer }) => {
            switch (type) {
                case 'Attr':
                case 'Text':
                    return renderer.evaluate.apply(
                        renderer,
                        [element].concat(injection)
                    );
            }

            var _data_ = data[element.dataset.view];

            if (!_data_ && _data_ !== null) return;

            View.clear(element);

            if (!_data_) return;

            if (!(_data_ instanceof Array)) _data_ = [_data_];

            element.append.apply(
                element,
                [].concat.apply(
                    [],
                    _data_.map(item => renderer.clone().render(item).topNodes)
                )
            );
        });

        return this;
    }
}
