import { HTMLProps, IndexKey } from 'web-utility';

export type DataObject = Record<string, any>;

export class VNode {
    key?: IndexKey;
    ref?: (node?: Node) => any;
    /**
     * @deprecated Will be removed in 2.1.0, use `ref(undefined)` instead
     */
    unRef?: (node: Node) => any;
    text?: string;
    selector?: string;
    tagName?: string;
    is?: string;
    props?: DataObject;
    style?: HTMLProps<HTMLElement>['style'];
    children?: VNode[];
    node?: Node;

    constructor(meta: VNode) {
        Object.assign(this, meta);

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

export type JsxProps<T extends HTMLElement> = Pick<
    VNode,
    'is' | 'key' | 'ref'
> &
    Omit<HTMLProps<T>, 'children'> & {
        children?: JsxChildren;
    };

declare global {
    /**
     * @see {@link https://www.typescriptlang.org/docs/handbook/jsx.html}
     */
    namespace JSX {
        type Element = VNode;

        type IntrinsicElements = {
            [tagName in keyof HTMLElementTagNameMap]: JsxProps<
                HTMLElementTagNameMap[tagName]
            >;
        };
        interface ElementAttributesProperty {
            props: {};
        }
        interface ElementChildrenAttribute {
            children: {};
        }
    }
}
