import Model from './Model';

import {
    parseDOM,
    scanDOM,
    stringifyDOM,
    attributeMap,
    attributeOnly
} from '../DOM/parser';

import Template from './Template';
import ViewList from './ViewList';

import { debounce, nextTick } from '../DOM/timer';
import { valueOf } from '../DOM/manipulate';
import CustomInputEvent, { watchInput } from '../DOM/CustomInputEvent';

const { findIndex, concat } = Array.prototype;

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

        view_top.set(this, []);

        Array.from(parseDOM(template).childNodes).forEach(
            node => (node.remove(), this.parse(node))
        );
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
     * @return {Number} Index in `childNodes`
     */
    static findTemplate({ childNodes }) {
        const index = findIndex.call(
            childNodes,
            ({ nodeName }) => nodeName.toLowerCase() === 'template'
        );

        return index > -1
            ? index
            : findIndex.call(childNodes, ({ nodeType }) => nodeType === 8);
    }

    /**
     * @param {HTMLElement} root
     *
     * @return {String}
     */
    static getTemplate(root) {
        const template = root.childNodes[this.findTemplate(root)];

        if (template) return template.innerHTML || template.nodeValue;

        const raw = root.innerHTML;

        return (root.innerHTML = '') || raw;
    }

    /**
     * @protected
     *
     * @param {Template|ViewList} template
     * @param {?Element}          element
     */
    addNode(template, element) {
        if (element instanceof Element) var name = (element.dataset || '').view;

        this.set(template, { element, name });

        if (template instanceof Template)
            concat
                .apply([], view_varible.map(key => template.keysOf(key)))
                .forEach(key => key && this.watch(key));
        else
            this.watch(name, {
                get: () =>
                    this.data[name] instanceof Array ? template : template[0]
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
            node => node === input || node.compareDocumentPosition(input) & 16
        );

        var list = top_input.get(top);

        if (!list) {
            top_input.set(top, (list = []));

            const update = debounce(target => {
                if (View.instanceOf(target) === this)
                    this.commit(target.name, valueOf(target));
            });

            top.addEventListener('change', ({ target }) => update(target));

            top.addEventListener(
                'input',
                event =>
                    event instanceof CustomInputEvent && update(event.target)
            );

            watchInput(top);
        }

        if (!list.includes(input)) list.push(input);
    }

    /**
     * @type {String[]}
     */
    get listenKeys() {
        return Array.from(
            new Set(
                concat.apply(
                    [],
                    this.topNodes
                        .map(node => {
                            const list = top_input.get(node);

                            return list && list.map(input => input.name);
                        })
                        .filter(Boolean)
                )
            ).values()
        );
    }

    /**
     * @param {Node} root
     */
    parse(root) {
        if (!root.parentNode) view_top.get(this).push(root);

        const injection = view_varible.concat(
            Object.keys(this[view_injection])
        );

        scanDOM(root, Template.Expression, {
            attribute: ({ ownerElement, name, value }) => {
                var onChange;

                name = attributeMap[name] || name;

                if (name in ownerElement && !(name in attributeOnly)) {
                    ownerElement.removeAttribute(name);

                    onChange = value => (ownerElement[name] = value);
                } else
                    onChange = value => ownerElement.setAttribute(name, value);

                this.addNode(
                    new Template(value, injection, onChange),
                    ownerElement
                );
            },
            text: node => {
                const { parentNode } = node;

                this.addNode(
                    new Template(
                        node.nodeValue,
                        injection,
                        !parentNode || parentNode.firstElementChild
                            ? value => (node.nodeValue = value)
                            : value => (parentNode.innerHTML = value)
                    ),
                    parentNode
                );
            },
            '[data-view]': node => {
                if ((ViewList.instanceOf(node) || '').root !== node)
                    this.addNode(
                        new ViewList(node, this.data, this[view_injection]),
                        node
                    );

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

        this.forEach(({ element }, template) => {
            if (template instanceof Template)
                template.evaluate.apply(template, [element].concat(injection));
        });

        for (let [view_list, { name }] of this.entries())
            if (view_list instanceof ViewList) {
                await nextTick();

                const data = temp[name];

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
