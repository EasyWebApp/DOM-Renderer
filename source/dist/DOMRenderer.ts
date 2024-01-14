import {
    diffKeys,
    DiffStatus,
    elementTypeOf,
    groupBy,
    isDOMReadOnly,
    templateOf,
    toCamelCase,
    toHyphenCase
} from 'web-utility';

import { DataObject, VNode } from './VDOM';

export class DOMRenderer {
    eventPattern = /^on[A-Z]/;
    ariaPattern = /^aira[A-Z]/;

    protected treeCache = new WeakMap<Node, VNode>();

    protected keyOf = ({ key, text, props, selector }: VNode, index?: number) =>
        key?.toString() || props?.id || (text || selector || '') + index;

    protected vNodeOf = (list: VNode[], key?: VNode['key']) =>
        list.find(
            (vNode, index) => `${this.keyOf(vNode, index)}` === String(key)
        );

    protected propsKeyOf = (key: string) =>
        key.startsWith('aria-')
            ? toCamelCase(key)
            : this.eventPattern.test(key)
              ? key.toLowerCase()
              : key;

    protected updateProps<N extends DataObject, P extends DataObject>(
        node: N,
        oldProps = {} as P,
        newProps = {} as P,
        onDelete?: (node: N, key: string) => any,
        onAdd?: (node: N, key: string, value: any) => any
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

    protected createNode(vNode: VNode, reusedVNodes?: Record<string, VNode[]>) {
        if (vNode.text)
            return (vNode.node = document.createTextNode(vNode.text));

        const reusedVNode =
            vNode.selector && reusedVNodes?.[vNode.selector]?.shift();

        vNode.node = vNode.tagName
            ? reusedVNode?.node ||
              document.createElement(vNode.tagName, { is: vNode.is })
            : document.createDocumentFragment();

        const { node } = this.patch(
            reusedVNode || { tagName: vNode.tagName, node: vNode.node },
            vNode
        );
        if (node) vNode.ref?.(node);

        return node;
    }

    deleteNode({ ref, unRef, node, children }: VNode) {
        if (node instanceof DocumentFragment)
            children?.forEach(this.deleteNode);
        else if (node) {
            (node as ChildNode).remove();

            ref?.();
            unRef?.(node);
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
        const deletingGroup =
            group[DiffStatus.Old] &&
            groupBy(
                group[DiffStatus.Old].map(([key]) =>
                    this.vNodeOf(oldList, key)
                ),
                ({ selector }) => selector + ''
            );
        const newNodes = newList.map((vNode, index) => {
            const key = this.keyOf(vNode, index);

            if (map[key] !== DiffStatus.Same)
                return this.createNode(vNode, deletingGroup);

            const oldVNode = this.vNodeOf(oldList, key)!;

            return vNode.text != null
                ? (vNode.node = oldVNode.node)
                : this.patch(oldVNode, vNode).node;
        });

        for (const selector in deletingGroup)
            for (const vNode of deletingGroup[selector]) this.deleteNode(vNode);

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
                              : VNode.propsMap[key] || key
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

    render(vNode: VNode, node: ParentNode = document.body) {
        var root = this.treeCache.get(node) || VNode.fromDOM(node);

        root = this.patch(root, { ...root, children: [vNode] });

        this.treeCache.set(node, root);

        return root;
    }

    renderToStaticMarkup(tree: VNode) {
        const { body } = document.implementation.createHTMLDocument();

        this.render(tree, body);

        return body.innerHTML;
    }
}
