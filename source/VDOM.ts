import { HTMLProps, IndexKey } from 'web-utility';

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
