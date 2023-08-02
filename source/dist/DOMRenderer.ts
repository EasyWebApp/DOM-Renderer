import {
    diffKeys,
    DiffStatus,
    elementTypeOf,
    isDOMReadOnly,
    templateOf,
    toCamelCase,
    toHyphenCase
} from 'web-utility';

import { DataObject, VDOMNode, VNode } from './VDOM';

export class DOMRenderer {
    eventPattern = /^on[A-Z]/;
    ariaPattern = /^aira[A-Z]/;

    protected keyOf = ({ key, text, props, selector }: VNode, index?: number) =>
        key || props?.id || text || (selector && selector + index);

    protected vNodeOf = (list: VNode[], key: string) =>
        list.find((vNode, index) => this.keyOf(vNode, index) + '' === key);

    protected propsKeyOf = (key: string) =>
        key.startsWith('aria-')
            ? toCamelCase(key)
            : this.eventPattern.test(key)
            ? key.toLowerCase()
            : key;

    protected updateProps<T extends DataObject>(
        node: T,
        oldProps: DataObject = {},
        newProps: DataObject = {},
        onDelete?: (node: T, key: string) => any,
        onAdd?: (node: T, key: string, value: any) => any
    ) {
        const { group } = diffKeys(
            Object.keys(oldProps),
            Object.keys(newProps)
        );

        for (const [key] of group[DiffStatus.Old] || []) onDelete?.(node, key);

        for (const [key] of [
            ...(group[DiffStatus.Same] || []),
            ...(group[DiffStatus.New] || [])
        ])
            if (oldProps[key] !== newProps[key])
                if (onAdd instanceof Function) onAdd(node, key, newProps[key]);
                else Reflect.set(node, key, newProps[key]);
    }

    protected createNode(vNode: VNode) {
        if (vNode.text)
            return (vNode.node = document.createTextNode(vNode.text));

        vNode.node = vNode.tagName
            ? document.createElement(vNode.tagName, { is: vNode.is })
            : document.createDocumentFragment();

        return this.patch({ tagName: vNode.tagName, node: vNode.node }, vNode)
            .node;
    }

    protected updateChildren(
        node: ParentNode,
        oldList: VNode[],
        newList: VNode[]
    ) {
        const { map, group } = diffKeys(
            oldList.map(this.keyOf),
            newList.map(this.keyOf)
        );

        for (const [key] of group[DiffStatus.Old] || [])
            (this.vNodeOf(oldList, key)?.node as ChildNode)?.remove();

        const newNodes = newList.map((vNode, index) => {
            const key = this.keyOf(vNode, index);

            if (map[key] === DiffStatus.Same)
                return this.patch(this.vNodeOf(oldList, key)!, vNode).node;

            return this.createNode(vNode);
        });

        node.append(...newNodes);
    }

    patch(oldVNode: VNode, newVNode: VNode): VNode {
        const { tagName } = oldVNode;
        const isXML = templateOf(tagName) && elementTypeOf(tagName) === 'xml';

        this.updateProps(
            oldVNode.node as Element,
            oldVNode.props,
            newVNode.props,
            (node, key) =>
                this.eventPattern.test(key)
                    ? (node[key.toLowerCase()] = null)
                    : node.removeAttribute(
                          this.ariaPattern.test(key)
                              ? toHyphenCase(key)
                              : VDOMNode.propsMap[key] || key
                      ),
            (node, key, value) => {
                // @ts-ignore
                if (isXML || key.includes('-') || isDOMReadOnly(tagName, key))
                    node.setAttribute(key, value);
                else node[this.propsKeyOf(key)] = value;
            }
        );
        this.updateProps(
            (oldVNode.node as HTMLElement).style,
            oldVNode.style,
            newVNode.style,
            (node, key) => node.removeProperty(key)
        );
        this.updateChildren(
            oldVNode.node as ParentNode,
            oldVNode.children || [],
            newVNode.children || []
        );
        newVNode.node = oldVNode.node;

        return newVNode;
    }

    render(vNode: VNode, node: Element = document.body) {
        const root = new VDOMNode(node);

        return this.patch(root, { ...root, children: [vNode] });
    }

    renderToStaticMarkup(tree: VNode) {
        const { body } = document.implementation.createHTMLDocument();

        this.render(tree, body);

        return body.innerHTML;
    }
}
