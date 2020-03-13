import { VChild } from './type';

const { slice } = Array.prototype;

export function create(vNode: VChild) {
    if (typeof vNode === 'string') return document.createTextNode(vNode);

    const { tagName, childNodes, ...props } = vNode;

    return Object.assign(document.createElement(tagName), props);
}

const cache = new WeakMap();

function save(root: Node, id: string, child: Node) {
    var map = cache.get(root);

    if (!map) cache.set(root, (map = {}));

    map[id] = child;
}

export function update(node: Element, vNode: VChild) {
    if (typeof vNode === 'string') return node.replaceWith(vNode);

    const { tagName, childNodes, ...props } = vNode;

    if (node.tagName?.toLowerCase() !== tagName) {
        const tag = document.createElement(tagName);

        node.replaceWith(tag);

        node = tag;
    }

    const prop_map = Object.entries(props);

    for (const { name } of node.attributes) {
        const [key] =
            prop_map.find(([key]) => key.toLowerCase() === name) || [];

        if (!key) node.removeAttribute(name);
    }

    for (const [key, value] of prop_map)
        if (value !== node[key]) node[key] = value;

    const children = node.childNodes;

    vNode.childNodes.forEach((child, index) => {
        var old = children[index];

        if (!old) {
            old = create(child);

            if (child.id) save(node, child.id, old);

            node.append(old);
        } else {
            const cached = cache.get(node)?.[child.id];

            if (cached) {
                old.before(cached);

                old = cached;
            }
        }

        update(old as Element, child);
    });

    for (const child of slice.call(children, vNode.childNodes.length))
        child.remove();
}
