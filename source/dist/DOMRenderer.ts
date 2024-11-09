import { findShadowRoots, generateHTML } from 'declarative-shadow-dom-polyfill';
import { ReadableStream } from 'web-streams-polyfill';
import {
    diffKeys,
    DiffStatus,
    elementTypeOf,
    groupBy,
    templateOf,
    toCamelCase,
    toHyphenCase
} from 'web-utility';

import { DataObject, VNode } from './VDOM';

export class DOMRenderer {
    eventPattern = /^on[A-Z]/;
    ariaPattern = /^aira[A-Z]/;

    document = globalThis.document;

    protected treeCache = new WeakMap<Node, VNode>();

    protected keyOf = ({ key, text, props, selector }: VNode, index?: number) =>
        key?.toString() || props?.id || (text || selector || '') + index;

    protected vNodeOf = (list: VNode[], key?: VNode['key']) =>
        list.find((vNode, index) => `${this.keyOf(vNode, index)}` === String(key));

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
        const { group } = diffKeys(Object.keys(oldProps), Object.keys(newProps));

        for (const [key] of group[DiffStatus.Old] || []) onDelete?.(node, key);

        for (const [key] of [...(group[DiffStatus.Same] || []), ...(group[DiffStatus.New] || [])])
            if (oldProps[key] !== newProps[key])
                if (onAdd instanceof Function) onAdd(node, key, newProps[key]);
                else Reflect.set(node, key, newProps[key]);
    }

    protected createNode(vNode: VNode, reusedVNodes?: Record<string, VNode[]>) {
        if (vNode.text) return vNode.createDOM(this.document);

        const reusedVNode = vNode.selector && reusedVNodes?.[vNode.selector]?.shift();

        vNode.node = reusedVNode?.node || vNode.createDOM(this.document);

        const { node } = this.patch(
            reusedVNode || new VNode({ tagName: vNode.tagName, node: vNode.node }),
            vNode
        );
        return node;
    }

    protected deleteNode({ ref, node, children }: VNode) {
        if (node instanceof DocumentFragment) children?.forEach(this.deleteNode);
        else if (node) {
            (node as ChildNode).remove();

            ref?.();
        }
    }

    protected commitChildren(root: ParentNode, newNodes: ChildNode[]) {
        for (const oldNode of [...root.childNodes]) {
            const index = newNodes.indexOf(oldNode);

            if (index < 0) continue;
            else if (index === 0) {
                newNodes.shift();
                continue;
            }
            const beforeNodes = newNodes.slice(0, index);

            if (!beforeNodes[0]) continue;

            oldNode.before(...beforeNodes);

            newNodes = newNodes.slice(index + 1);
        }

        if (newNodes[0]) root.append(...newNodes);
    }

    protected updateChildren(node: ParentNode, oldList: VNode[], newList: VNode[]) {
        const { map, group } = diffKeys(oldList.map(this.keyOf), newList.map(this.keyOf));
        const deletingGroup =
            group[DiffStatus.Old] &&
            groupBy(
                group[DiffStatus.Old].map(([key]) => this.vNodeOf(oldList, key)),
                ({ selector }) => selector + ''
            );
        const newNodes = newList.map((vNode, index) => {
            const key = this.keyOf(vNode, index);

            if (map[key] !== DiffStatus.Same) return this.createNode(vNode, deletingGroup);

            const oldVNode = this.vNodeOf(oldList, key)!;

            return vNode.text != null
                ? (vNode.node = oldVNode.node)
                : this.patch(oldVNode, vNode).node;
        });

        for (const selector in deletingGroup)
            for (const vNode of deletingGroup[selector]) this.deleteNode(vNode);

        this.commitChildren(node, newNodes as ChildNode[]);

        for (const { ref, node } of newList) ref?.(node);
    }

    protected handleCustomEvent(node: EventTarget, event: string) {
        var handler: EventListener;

        Object.defineProperty(node, `on${event}`, {
            set: value => {
                if (handler) node.removeEventListener(event, handler);

                node.addEventListener(event, (handler = value));
            },
            get: () => handler
        });
    }

    protected removeProperty = (node: Element, key: string) =>
        this.eventPattern.test(key)
            ? (node[key.toLowerCase()] = null)
            : node.removeAttribute(
                  this.ariaPattern.test(key) ? toHyphenCase(key) : VNode.propsMap[key] || key
              );
    protected setProperty = (node: Element, key: string, value: string) => {
        const isXML = templateOf(node.tagName) && elementTypeOf(node.tagName) === 'xml';

        if (isXML || key.includes('-')) node.setAttribute(key, value);
        else
            try {
                const name = this.propsKeyOf(key);

                if (this.eventPattern.test(key) && !(name in node))
                    this.handleCustomEvent(node, name.slice(2));

                node[name] = value;
            } catch {
                node.setAttribute(key, value);
            }
    };

    patch(oldVNode: VNode, newVNode: VNode): VNode {
        this.updateProps(
            oldVNode.node as Element,
            oldVNode.props,
            newVNode.props,
            this.removeProperty,
            this.setProperty
        );
        this.updateProps(
            (oldVNode.node as HTMLElement).style,
            oldVNode.style,
            newVNode.style,
            (node, key) => node.removeProperty(toHyphenCase(key)),
            (node, key, value) => node.setProperty(toHyphenCase(key), value)
        );
        this.updateChildren(
            oldVNode.node as ParentNode,
            oldVNode.children || [],
            (newVNode.children = newVNode.children?.map(vNode => new VNode(vNode)) || [])
        );
        newVNode.node = oldVNode.node;

        return newVNode;
    }

    render(vNode: VNode, node: ParentNode = globalThis.document?.body) {
        this.document = node.ownerDocument;

        var root = this.treeCache.get(node) || VNode.fromDOM(node);

        root = this.patch(root, new VNode({ ...root, children: [vNode] }));

        this.treeCache.set(node, root);

        return root;
    }

    protected buildRenderTree(tree: VNode) {
        const { body } = this.document.implementation.createHTMLDocument();

        this.render(tree, body);

        const shadowRoots = [...findShadowRoots(body)];

        return { body, shadowRoots };
    }

    renderToStaticMarkup(tree: VNode) {
        const { body, shadowRoots } = this.buildRenderTree(tree);

        return body.getHTML({ serializableShadowRoots: true, shadowRoots });
    }

    renderToReadableStream(tree: VNode) {
        const { body, shadowRoots } = this.buildRenderTree(tree);

        return ReadableStream.from(
            generateHTML(body, { serializableShadowRoots: true, shadowRoots })
        );
    }
}
