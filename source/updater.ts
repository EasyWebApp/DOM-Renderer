import { VChild, Props, VChildNode, VElement } from './creator';
import { find } from './utility';
import { AsyncComponent } from './AsyncComponent';

export function updateProps(node: HTMLElement, props: Props) {
    const { style = {}, ...data } = props;
    const keys = Object.keys(data);

    for (const { name } of [...node.attributes])
        if (!keys.find(key => name === key.toLowerCase()))
            (node as Element).removeAttribute(name);

    for (const name of [...node.style].filter(name => !(name in style)))
        node.style.removeProperty(name);

    Object.assign(node.style, style);

    const [attr_list, prop_list] = keys.reduce(
        ([attr_list, prop_list], key) => {
            if (/\W/.test(key)) attr_list.push(key);
            else prop_list.push(key);

            return [attr_list, prop_list];
        },
        [[], []] as string[][]
    );

    for (const key of attr_list)
        node.setAttribute(key.toLowerCase(), data[key]);

    Object.assign(
        node,
        Object.fromEntries(
            prop_list.map(key => [
                /^on[A-Z]\w+$/.test(key) ? key.toLowerCase() : key,
                data[key]
            ])
        )
    );
}

export function insertChild(
    root: HTMLElement,
    node: string | Node,
    index = root.childNodes.length
) {
    const old = root.childNodes[index];

    if (old) old.before(node);
    else root.append(node);
}

export function updateChild(root: HTMLElement, node: VChild, index: number) {
    var old: Node;

    if (typeof node === 'object') {
        const { tagName, childNodes, ...props } = node;

        old =
            find(
                root.childNodes,
                ({ nodeName }) => nodeName.toLowerCase() === tagName,
                index
            ) || document.createElement(tagName);

        if (root.childNodes[index] !== old) insertChild(root, old, index);

        updateProps(old as HTMLElement, props);
    } else {
        node = node + '';

        old =
            find(
                root.childNodes,
                ({ nodeValue }) => nodeValue === node,
                index
            ) || document.createTextNode(node);

        if (root.childNodes[index] !== old) insertChild(root, old, index);
    }

    return old;
}

export async function updateTree(children: VChildNode[], root: HTMLElement) {
    var cursor = 0;

    for (const vNode of children)
        if (vNode instanceof AsyncComponent) {
            const realNodes = [];

            for (const item of await vNode.render()) {
                const node = updateChild(root, item, cursor);
                cursor++;

                realNodes.push(node);

                if (node instanceof HTMLElement)
                    await updateTree(item.childNodes, node);
            }
            vNode.realNodes = realNodes;
        } else {
            const node = updateChild(root, vNode, cursor);
            cursor++;

            if (node instanceof HTMLElement)
                await updateTree((vNode as VElement).childNodes, node);
        }

    for (const node of [...root.childNodes].slice(cursor)) node.remove();
}
