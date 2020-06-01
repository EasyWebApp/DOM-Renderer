import { HTMLProps } from 'web-utility/source/DOM-type';
import { clearList } from './utility';
import { AsyncComponent } from './AsyncComponent';

export interface VElement {
    tagName: string;
    childNodes: VChildNode[];
    [key: string]: any;
}
export type VChild = string | number | boolean | VElement;
export type VChildNode = VChild | AsyncComponent;
export type VChildren = VChildNode | VChildNode[];

export type GeneratorNode = Generator<VChildren, any, Node | Node[]>;
export type AsyncGeneratorNode = AsyncGenerator<VChildren, any, Node | Node[]>;

export type AsyncNode = Promise<VChildren> | GeneratorNode | AsyncGeneratorNode;

export type RenderNode = VChildren | AsyncNode;

export interface Props extends HTMLProps {
    children?: VChildren;
    [key: string]: any;
}

export type FunctionComponent = (props: Props) => RenderNode;

export type Component = string | FunctionComponent;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [tagName: string]: Props;
        }
        interface ElementChildrenAttribute {
            children: VChildren;
        }
    }
}

export function createElement(
    tagName: Component,
    props: Props | null,
    ...childNodes: VChildNode[]
) {
    childNodes = clearList(childNodes);

    if (typeof tagName === 'string')
        return {
            ...props,
            tagName: tagName as string,
            childNodes
        };

    props = { ...props, children: childNodes };

    const result = tagName(props);

    if (typeof (result as Promise<any>).then === 'function')
        return new AsyncComponent(async function* () {
            yield await (result as Promise<any>);
        }, props);

    if (typeof (result as Generator).next === 'function')
        return new AsyncComponent(tagName, props);

    return result;
}

export function Fragment({ children }: Props) {
    return children;
}
