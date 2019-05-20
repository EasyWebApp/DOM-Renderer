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
 * @param {Node[]} list
 * @param {Number} [index]
 *
 * @return {Number}
 */
export function insertableIndexOf(list, index) {
    return !(index != null) || index > list.length
        ? list.length
        : index < 0
            ? list.length + index
            : index;
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

    if (Object(fragment) instanceof String) return parseDOM(fragment);

    let node = document.createDocumentFragment();

    node.append.apply(
        node,
        Array.from(fragment, item =>
            item.parentNode ? item.cloneNode(true) : item
        )
    );

    return node;
}
