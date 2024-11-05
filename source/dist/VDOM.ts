import { HTMLProps, IndexKey, isEmpty } from 'web-utility';

export type DataObject = Record<string, any>;

export type VNodeStyle = HTMLProps<HTMLElement>['style'] & {
    [K in `--${string}`]?: string;
};

export const XMLNamespace = {
    html: 'http://www.w3.org/1999/xhtml',
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
};

export class VNodeMeta {
    key?: IndexKey;
    ref?: (node?: Node) => any;
    text?: string;
    selector?: string;
    namespace?: string;
    tagName?: string;
    is?: string;
    props?: DataObject;
    style?: VNodeStyle;
    parent?: VNode;
    children?: VNode[] = [];
    node?: Node;
}

export class VNode extends VNodeMeta {
    constructor({ children, ...meta }: VNodeMeta) {
        super();
        Object.assign(this, meta);

        for (const vNode of children || [])
            this.children.push(...(VNode.isFragment(vNode) ? vNode.children || [] : [vNode]));

        for (const child of this.children) child.parent = this;

        const { tagName, is, props } = meta;

        if (!tagName && !props?.className && !is) return;

        this.selector = [
            tagName?.toLowerCase(),
            props?.className && `.${props.className.trim().replace(/\s+/, '.')}`,
            is && `[is="${is}"]`
        ]
            .filter(Boolean)
            .join('');
    }

    *walkUp() {
        var current: VNode = this;

        while ((current = current.parent)) yield current;
    }

    findNamespace() {
        for (const { namespace } of this.walkUp()) if (namespace) return namespace;
    }

    createDOM(document = globalThis.document) {
        const { tagName, is, text } = this;

        return (this.node = text
            ? document.createTextNode(text)
            : !tagName
              ? document.createDocumentFragment()
              : document.createElementNS(
                    (this.namespace ||= XMLNamespace[tagName] || this.findNamespace()),
                    tagName,
                    { is }
                ));
    }

    toJSON(): VNodeMeta {
        const { key, text, selector, namespace, tagName, is, props, style, children } = this;

        return JSON.parse(
            JSON.stringify({ key, text, selector, namespace, tagName, is, props, style, children })
        );
    }

    static propsMap: Partial<Record<keyof HTMLProps<HTMLLabelElement>, string>> = {
        className: 'class',
        htmlFor: 'for'
    };

    static attrsMap: Record<string, keyof HTMLProps<HTMLLabelElement>> = Object.fromEntries(
        Object.entries(this.propsMap).map(item => item.reverse())
    );

    static isFragment({ key, node, children, ...rest }: VNode) {
        for (const key in rest) if (!isEmpty(rest[key])) return false;
        return true;
    }

    static fromDOM(node: Node) {
        if (node instanceof Text) return new VNode({ node, text: node.nodeValue });

        if (!(node instanceof Element)) return new VNode({ node });

        const { namespaceURI, tagName, attributes, style, childNodes } = node as HTMLElement;
        const vNode: VNodeMeta = {
            node,
            namespace: namespaceURI,
            tagName: tagName.toLowerCase(),
            is: node.getAttribute('is')
        };
        const props = Array.from(
            attributes,
            ({ name, value }) => name !== 'style' && [this.attrsMap[name] || name, value]
        ).filter(Boolean);

        if (props[0]) vNode.props = Object.fromEntries(props);

        const styles = Array.from(style, key => [key, style[key]]);

        if (styles[0]) vNode.style = Object.fromEntries(styles);

        const children = Array.from(childNodes, node => VNode.fromDOM(node));

        if (children[0]) vNode.children = children;

        return new VNode(vNode);
    }
}

export type JsxChild = VNode | string | number | boolean | null | undefined;
export type JsxChildren = JsxChild | Array<JsxChildren>;

export type JsxProps<T extends HTMLElement> = DataObject &
    Pick<VNode, 'is' | 'key' | 'ref'> &
    Omit<HTMLProps<T>, 'children'> & {
        children?: JsxChildren;
    };

declare global {
    /**
     * @see {@link https://www.typescriptlang.org/docs/handbook/jsx.html}
     */
    namespace JSX {
        type Element = VNode;

        type JSXElements = {
            [tagName in keyof HTMLElementTagNameMap]: JsxProps<HTMLElementTagNameMap[tagName]>;
        };
        interface IntrinsicElements extends JSXElements {}

        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}
