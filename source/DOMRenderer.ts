import { diffKeys, DiffStatus, IndexKey } from 'web-utility';

export type DataObject = Record<string, any>;

export interface VNode {
    key?: IndexKey;
    text?: string;
    tagName?: string;
    props?: DataObject;
    style?: DataObject;
    children?: VNode[];
    node?: Node;
}

export class DOMRenderer {
    protected keyOf = ({ key, text, props }: VNode, index?: number) =>
        key || props?.id || text || index;

    protected updateProps<T extends DataObject>(
        node: T,
        oldProps: DataObject = {},
        newProps: DataObject = {},
        onDelete?: (node: T, key: string) => any
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
                Reflect.set(node, key, newProps[key]);
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

        for (const [key] of group[DiffStatus.Old] || []) {
            const { node } =
                oldList.find(vNode => this.keyOf(vNode) === key) || {};

            (node as ChildNode)?.remove();
        }

        const newNodes = newList
            .map((vNode, index) => {
                const key = this.keyOf(vNode, index);

                switch (map[key]) {
                    case DiffStatus.New:
                        return this.createNode(vNode);
                    case DiffStatus.Same:
                        return this.patch(
                            oldList.find(vNode => this.keyOf(vNode) === key)!,
                            vNode
                        ).node;
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
            (node, key) => node.removeAttribute(key)
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
}
