import { insertableIndexOf, likeArray } from '../object/array';

import { parseDOM } from './parser';

/**
 * @param {Node}    node
 * @param {Boolean} [inNodes] - Seek in all kinds of `Node`
 *
 * @return {Number} The index of `node` in its siblings
 */
export function indexOf(node, inNodes) {
    var key = `previous${inNodes ? '' : 'Element'}Sibling`,
        index = 0;

    while ((node = node[key])) index++;

    return index;
}

/**
 * @param {ParentNode}  parent
 * @param {Node|String} child      - https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append#Parameters
 * @param {Number|Node} [position]
 * @param {Boolean}     [inNodes]  - Seek in all kinds of `Node`
 */
export function insertTo(parent, child, position, inNodes) {
    const list = Array.from(parent[`child${inNodes ? 'Nodes' : 'ren'}`]);

    position =
        position instanceof Node
            ? indexOf(position, inNodes)
            : insertableIndexOf(list, position);

    const point = list.slice(position)[0];

    if (point) point.before(child);
    else parent.append(child);
}

/**
 * @param {String|Node[]} fragment
 *
 * @return {?DocumentFragment}
 */
export function makeNode(fragment) {
    if (fragment instanceof Node) return fragment;

    if (!likeArray(fragment)) return parseDOM(fragment + '');

    let node = document.createDocumentFragment();

    node.append.apply(
        node,
        Array.from(fragment, item =>
            item.parentNode ? item.cloneNode(true) : item
        )
    );

    return node;
}

/**
 * @param {HTMLElement} input
 *
 * @return {String|String[]}
 */
export function valueOf(input) {
    const { type, value } = input;

    switch (type) {
        case 'radio':
        case 'checkbox': {
            const root = input.form || input.getRootNode();

            const data = Array.from(
                root.querySelectorAll(
                    `input[type="${type}"][name="${input.name}"]`
                ),
                item => item.checked && item.value
            ).filter(Boolean);

            return type === 'radio' ? data[0] : data;
        }
        case 'select-multiple':
            return Array.from(
                input.options,
                node => node.selected && node.value
            ).filter(Boolean);
    }

    return value;
}
