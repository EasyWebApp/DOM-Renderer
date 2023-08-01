import { diffKeys, DiffStatus } from 'web-utility';

import { DataObject, VNode } from './VDOM';

export class DOMRenderer {
    propsMap: DataObject = { className: 'class', htmlFor: 'for' };

    attrsMap = Object.fromEntries(
        Object.entries(this.propsMap).map(item => item.reverse())
    );
    eventPattern = /^on\w+/;

    protected keyOf = ({ key, text, props }: VNode, index?: number) =>
        key || props?.id || text || index;

    protected vNodeOf = (list: VNode[], key: string) =>
        list.find((vNode, index) => this.keyOf(vNode, index) + '' === key);

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

        if (vNode.tagName) {
            vNode.node = document.createElement(vNode.tagName);

            return this.patch(
                { tagName: vNode.tagName, node: vNode.node },
                vNode
            ).node;
        }
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

        const newNodes = newList
            .map((vNode, index) => {
                const key = this.keyOf(vNode, index);

                switch (map[key]) {
                    case DiffStatus.New:
                        return this.createNode(vNode);
                    case DiffStatus.Same:
                        return this.patch(this.vNodeOf(oldList, key)!, vNode)
                            .node;
                }
            })
            .filter(Boolean) as Node[];

        node.append(...newNodes);
    }

    patch(oldVNode: VNode, newVNode: VNode): VNode {
        this.updateProps(
            oldVNode.node as Element,
            oldVNode.props,
            newVNode.props,
            (node, key) =>
                this.eventPattern.test(key)
                    ? (node[key.toLowerCase()] = null)
                    : node.removeAttribute(this.propsMap[key] || key),
            (node, key, value) =>
                (node[this.eventPattern.test(key) ? key.toLowerCase() : key] =
                    value)
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

    toVNode = (node: Node): VNode => {
        if (node instanceof Text) return { node, text: node.nodeValue };

        if (!(node instanceof Element)) return;

        const { tagName, attributes, style, childNodes } = node as HTMLElement;

        const vNode: VNode = { node, tagName: tagName.toLowerCase() };

        const props = Array.from(
            attributes,
            ({ name, value }) =>
                name !== 'style' && [this.attrsMap[name] || name, value]
        ).filter(Boolean);

        if (props[0]) vNode.props = Object.fromEntries(props);

        const styles = Array.from(style, key => [key, style[key]]);

        if (styles[0]) vNode.style = Object.fromEntries(styles);

        const children = Array.from(childNodes, this.toVNode).filter(Boolean);

        if (children[0]) vNode.children = children;

        return vNode;
    };

    render(vNode: VNode, node: Element = document.body) {
        const root = this.toVNode(node);

        return this.patch(root, { ...root, children: [vNode] });
    }
}
