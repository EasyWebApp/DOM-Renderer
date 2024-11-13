import { findShadowRoots } from 'declarative-shadow-dom-polyfill';
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

export interface UpdateTask {
    index?: number;
    oldVNode?: VNode;
    newVNode?: VNode;
}

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

    protected deleteNode({ ref, node, children }: VNode) {
        if (node instanceof DocumentFragment) children?.forEach(this.deleteNode);
        else if (node) {
            (node as ChildNode).remove();

            ref?.();
        }
    }

    protected commitChild(root: ParentNode, node: Node, index = 0) {
        const targetNode = root.childNodes[index];

        if (targetNode === node) return;

        if (!targetNode) root.append(node);
        else targetNode.before(node);
    }

    protected *diffVChildren(oldVNode: VNode, newVNode: VNode): Generator<UpdateTask> {
        newVNode.children = newVNode.children.map(vNode => new VNode(vNode));

        const { map, group } = diffKeys(
            oldVNode.children!.map(this.keyOf),
            newVNode.children!.map(this.keyOf)
        );
        const deletingGroup =
            group[DiffStatus.Old] &&
            groupBy(
                group[DiffStatus.Old].map(([key]) => this.vNodeOf(oldVNode.children!, key)),
                ({ selector }) => selector + ''
            );

        for (const [index, newVChild] of newVNode.children!.entries()) {
            const key = this.keyOf(newVChild, index);

            let oldVChild =
                map[key] == DiffStatus.Same
                    ? this.vNodeOf(oldVNode.children!, key)
                    : deletingGroup?.[newVChild.selector]?.shift();

            yield { index, oldVNode: oldVChild, newVNode: newVChild };

            if (oldVChild?.children[0] || newVChild.children[0]) {
                oldVChild ||= new VNode({ ...newVChild, children: [] });

                yield* this.diffVChildren(oldVChild, newVChild);
            }
        }
        for (const selector in deletingGroup)
            for (const oldVNode of deletingGroup[selector]) yield { oldVNode };
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

    protected patchNode(oldVNode: VNode, newVNode: VNode) {
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
            (style, key) => style.removeProperty(toHyphenCase(key)),
            (style, key, value) => style.setProperty(toHyphenCase(key), value)
        );
        newVNode.node ||= oldVNode.node;
    }

    patch(oldVRoot: VNode, newVRoot: VNode) {
        if (VNode.isFragment(newVRoot))
            newVRoot = new VNode({ ...oldVRoot, children: newVRoot.children });

        this.patchNode(oldVRoot, newVRoot);

        for (let { index, oldVNode, newVNode } of this.diffVChildren(oldVRoot, newVRoot)) {
            if (!newVNode) {
                this.deleteNode(oldVNode);
                continue;
            }
            const inserting = !oldVNode;

            if (oldVNode) newVNode.node = oldVNode.node;
            else {
                newVNode.createDOM(this.document);

                const { tagName, node, parent } = newVNode;

                oldVNode = new VNode({ tagName, node, parent });
            }

            if (newVNode.text) oldVNode.node.nodeValue = newVNode.text;
            else if (!VNode.isFragment(newVNode)) this.patchNode(oldVNode, newVNode);

            if (oldVNode.parent) {
                this.commitChild(oldVNode.parent.node as ParentNode, newVNode.node, index);

                if (inserting) newVNode.ref?.(newVNode.node);
            }
        }
        return newVRoot;
    }

    render(vNode: VNode, node: ParentNode = globalThis.document?.body) {
        this.document = node.ownerDocument;

        var root = this.treeCache.get(node) || VNode.fromDOM(node);

        root = this.patch(root, new VNode({ ...root, children: [vNode] }));

        this.treeCache.set(node, root);

        return root;
    }

    *generateHTML(vNode: VNode): Generator<string> {
        if (VNode.isFragment(vNode)) {
            yield '<template';

            const { mode } = (vNode.node || {}) as ShadowRoot;

            if (mode) yield ` shadowrootmode="${mode}"`;

            yield '>';
        } else if (vNode.text != null) yield vNode.text;
        else {
            const { tagName, props, style, children } = vNode;

            if (tagName.includes('-') && elementTypeOf(tagName) === 'html') {
                const { body } = this.document.implementation.createHTMLDocument();

                body.innerHTML = `<${tagName}></${tagName}>`;

                const shadowRoots = [...findShadowRoots(body)];

                yield body.getHTML({ serializableShadowRoots: true, shadowRoots });
            } else {
                yield `<${tagName}`;

                for (const key in props) yield ` ${key}="${props[key]}"`;

                if (style) {
                    yield ` style="`;

                    for (const key in style) yield `${toHyphenCase(key)}:${style[key]};`;

                    yield `"`;
                }
                if (!children[0]) yield ` />`;
                else {
                    yield '>';

                    for (const child of children) yield* this.generateHTML(child);

                    yield `</${tagName}>`;
                }
            }
        }
    }

    renderToStaticMarkup(tree: VNode) {
        return [...this.generateHTML(tree)].join('');
    }

    renderToReadableStream(tree: VNode) {
        return ReadableStream.from(this.generateHTML(tree));
    }
}
