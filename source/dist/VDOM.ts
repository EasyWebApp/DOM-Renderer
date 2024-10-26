import { HTMLProps, IndexKey, isEmpty } from 'web-utility';

export type DataObject = Record<string, any>;

export type VNodeStyle = HTMLProps<HTMLElement>['style'] & {
    [K in `--${string}`]?: string;
};

export class VNode {
    key?: IndexKey;
    ref?: (node?: Node) => any;
    text?: string;
    selector?: string;
    tagName?: string;
    is?: string;
    props?: DataObject;
    style?: VNodeStyle;
    children?: VNode[];
    node?: Node;

    constructor({ children, ...meta }: VNode) {
        Object.assign(this, meta);

        for (const vNode of children || [])
            if (VNode.isFragment(vNode))
                this.children = [
                    ...(this.children || []),
                    ...(vNode.children || [])
                ];
            else this.children = [...(this.children || []), vNode];

        const { tagName, is, props } = meta;

        if (!tagName && !props?.className && !is) return;

        this.selector = [
            tagName?.toLowerCase(),
            props?.className &&
                `.${props.className.trim().replace(/\s+/, '.')}`,
            is && `[is="${is}"]`
        ]
            .filter(Boolean)
            .join('');
    }

    static propsMap: Partial<
        Record<keyof HTMLProps<HTMLLabelElement>, string>
    > = {
        className: 'class',
        htmlFor: 'for'
    };

    static attrsMap: Record<string, keyof HTMLProps<HTMLLabelElement>> =
        Object.fromEntries(
            Object.entries(this.propsMap).map(item => item.reverse())
        );

    static isFragment({ key, node, children, ...rest }: VNode) {
        for (const key in rest) if (!isEmpty(rest[key])) return false;
        return true;
    }

    static fromDOM(node: Node) {
        if (node instanceof Text)
            return new VNode({ node, text: node.nodeValue });

        if (!(node instanceof Element)) return new VNode({ node });

        const { tagName, attributes, style, childNodes } = node as HTMLElement;
        const vNode: VNode = {
            node,
            tagName: tagName.toLowerCase(),
            is: node.getAttribute('is')
        };
        const props = Array.from(
            attributes,
            ({ name, value }) =>
                name !== 'style' && [this.attrsMap[name] || name, value]
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
            [tagName in keyof HTMLElementTagNameMap]: JsxProps<
                HTMLElementTagNameMap[tagName]
            >;
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
