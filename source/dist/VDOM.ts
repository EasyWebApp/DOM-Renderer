import { HTMLProps, IndexKey } from 'web-utility';

export type DataObject = Record<string, any>;

export interface VNode {
    key?: IndexKey;
    text?: string;
    selector?: string;
    tagName?: string;
    props?: DataObject;
    style?: DataObject;
    children?: VNode[];
    node?: Node;
}

export class VDOMNode implements VNode {
    text?: string;
    tagName?: string;
    props?: DataObject;
    style?: DataObject;
    children?: VNode[];

    static selectorOf = (tagName: string, className?: string) =>
        tagName.toLowerCase() +
        (className ? `.${className.trim().replace(/\s+/, '.')}` : '');

    get selector() {
        const { tagName, props } = this;

        return tagName && VDOMNode.selectorOf(tagName, props?.className);
    }

    static propsMap: DataObject = { className: 'class', htmlFor: 'for' };

    static attrsMap = Object.fromEntries(
        Object.entries(this.propsMap).map(item => item.reverse())
    );

    constructor(public node: Node) {
        if (node instanceof Text) {
            this.text = node.nodeValue;
            return;
        }
        if (!(node instanceof Element)) return;

        const { tagName, attributes, style, childNodes } = node as HTMLElement;

        this.tagName = tagName.toLowerCase();

        const props = Array.from(
            attributes,
            ({ name, value }) =>
                name !== 'style' && [VDOMNode.attrsMap[name] || name, value]
        ).filter(Boolean);

        if (props[0]) this.props = Object.fromEntries(props);

        const styles = Array.from(style, key => [key, style[key]]);

        if (styles[0]) this.style = Object.fromEntries(styles);

        const children = Array.from(childNodes, node => new VDOMNode(node));

        if (children[0]) this.children = children;
    }
}

type HTMLTags = {
    [tagName in keyof HTMLElementTagNameMap]: HTMLProps<
        HTMLElementTagNameMap[tagName]
    >;
} & {
    [tagName: string]: HTMLProps<HTMLElement>;
};

declare global {
    namespace JSX {
        interface IntrinsicElements extends HTMLTags {}
    }
}
