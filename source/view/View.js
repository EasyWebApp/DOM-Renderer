import Model from './Model';

import {
    parseDOM,
    scanDOM,
    stringifyDOM,
    attributeMap,
    valueOf
} from '../DOM/parser';

import Template from './Template';

import ViewList from './ViewList';

import { debounce, nextTick } from '../DOM/timer';

import CustomInputEvent, { watchInput } from '../DOM/CustomInputEvent';

const { forEach, push, concat } = Array.prototype;

const iterator = [][Symbol.iterator];

const view_template = Symbol('View template'),
    view_top = new Map(),
    view_injection = Symbol('View injection'),
    view_varible = ['view', 'scope'],
    top_input = new WeakMap();

export default class View extends Model {
    /**
     * @param {String}  template
     * @param {?Object} scope          - Data of parent View
     * @param {Object}  [injection={}] - Key for Template varible
     */
    constructor(template, scope, injection = {}) {
        super(scope, 'render');

        (this[view_template] = template + ''),
        (this[view_injection] = injection);

        const top = [];

        view_top.set(this, top);

        Array.from(parseDOM(template).childNodes).forEach(node => {
            node.remove();

            top.push(node);

            if (node.nodeType === 1) this.parseTree(node);
        });

        Object.freeze(top);
    }

    [Symbol.iterator]() {
        return iterator.call(this);
    }

    /**
     * @param {Node} node
     *
     * @return {?View}
     */
    static instanceOf(node) {
        do {
            for (let [view, top] of view_top)
                if (top.includes(node)) return view;
        } while ((node = node.parentNode));
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
        return stringifyDOM(this.topNodes).replace(/\s+$/gm, '');
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
     * @param {String}          type
     * @param {Element}         element
     * @param {Template|String} template
     */
    addNode(type, element, template) {
        const name = element.dataset.view;

        push.call(this, { type, element, template, name });

        if (type !== 'View') {
            concat
                .apply([], view_varible.map(name => template.keysOf(name)))
                .forEach(name => name && this.watch(name));

            return;
        }

        const view_list = new ViewList(
            element,
            this.data,
            this[view_injection]
        );

        this.watch(name, {
            get: () => (view_list[1] ? view_list : view_list[0])
        });
    }

    /**
     * @param {Element} input
     *
     * @listens {Event}            - `change` event
     * @listens {CustomInputEvent}
     */
    listen(input) {
        const top = this.topNodes.find(
                node =>
                    node === input || node.compareDocumentPosition(input) & 16
            ),
            update = debounce(({ target }) => {
                if (View.instanceOf(target) === this)
                    this.commit(target.name, valueOf(target));
            });

        var list = top_input.get(top);

        if (!list) {
            top_input.set(top, (list = []));

            top.addEventListener('change', update);

            top.addEventListener(
                'input',
                event => event instanceof CustomInputEvent && update(event)
            );

            watchInput(top);
        }

        list.push(input.name);
    }

    /**
     * @type {String[]}
     */
    get listenKeys() {
        return concat.apply(
            [],
            this.topNodes.map(node => top_input.get(node)).filter(Boolean)
        );
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

        scanDOM(root, Template.Expression, {
            attribute: ({ ownerElement, name, value }) => {
                var onChange;

                name = attributeMap[name] || name;

                if (name in ownerElement) {
                    ownerElement.removeAttribute(name);

                    onChange = value => (ownerElement[name] = value);
                } else
                    onChange = value => ownerElement.setAttribute(name, value);

                this.addNode(
                    'Attr',
                    ownerElement,
                    new Template(value, injection, onChange)
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
            '[data-view]': node => {
                this.addNode('View', node, View.getTemplate(node).trim());

                return false;
            },
            'input[name], textarea[name], select[name]': node => {
                if (View.instanceOf(node) === this) this.listen(node);
            }
        });
    }

    /**
     * @type {?Element}
     */
    get root() {
        return this.topNodes[0].parentNode;
    }

    /**
     * @param {Object} data
     *
     * @emits {CustomEvent} - Cancelable `render`
     * @emits {CustomEvent} - `rendered`
     */
    async render(data) {
        const { root } = this;

        if (
            root &&
            !root.dispatchEvent(
                new CustomEvent('render', {
                    bubbles: true,
                    cancelable: true,
                    detail: { view: this, oldData: this.data, newData: data }
                })
            )
        )
            return;

        const temp = this.patch(data);

        const injection = [temp, this.scope].concat(
            Object.values(this[view_injection])
        );

        forEach.call(this, ({ type, element, template }) => {
            if (type !== 'View')
                template.evaluate.apply(template, [element].concat(injection));
        });

        for (let { type, element, name } of this)
            if (type === 'View') {
                await nextTick();

                const view_list = new ViewList(element),
                    data = temp[name];

                if (data === null) view_list.clear();
                else if (data)
                    await view_list.render(
                        data instanceof Array ? data : [data]
                    );
            }

        if (root)
            root.dispatchEvent(
                new CustomEvent('rendered', {
                    bubbles: true,
                    detail: { view: this, data }
                })
            );
    }

    destroy() {
        view_top.get(this).forEach(node => node.remove());

        view_top.delete(this);
    }
}
