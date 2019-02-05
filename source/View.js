import { parseDOM, scanTemplate, stringifyDOM, attributeMap } from './utility';

import Template from './Template';

const forEach = [].forEach;

const view_template = Symbol('View template'),
    view_top = new Map();

export default class View extends Map {
    /**
     * @param {String} template
     */
    constructor(template) {
        super()[view_template] = template + '';

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
        forEach.call(
            root.childNodes,
            node => view_top.delete(node) && node.remove()
        );
    }

    /**
     * @return {View}
     */
    clone() {
        return new View(this[view_template]);
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
     * @private
     *
     * @param {String}        type
     * @param {Element}       element
     * @param {Template|View} renderer
     */
    addNode(type, element, renderer) {
        this.set({ type, element }, renderer);
    }

    /**
     * @private
     *
     * @param {Element} root
     */
    parseTree(root) {
        scanTemplate(root, Template.Expression, '[data-view]', {
            attribute: ({ ownerElement, name, value }) => {
                name = attributeMap[name] || name;

                this.addNode(
                    'Attr',
                    ownerElement,
                    new Template(
                        value,
                        ['view'],
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
                        ['view'],
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
                    new View(View.getTemplate(node).trim())
                )
        });
    }

    /**
     * @param {Object} data
     *
     * @return {View}
     */
    render(data) {
        this.forEach((renderer, { type, element }) => {
            switch (type) {
                case 'Attr':
                case 'Text':
                    return renderer.evaluate(element, data);
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
