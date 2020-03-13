export interface VNode {
    tagName: string;
    childNodes: VNode[];
    id?: string;
    [key: string]: any;
}

export type VChild = string | VNode;

export interface CustomElementClass {
    new (): HTMLElement;
}
