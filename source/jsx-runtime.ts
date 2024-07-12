import { IndexKey, isEmpty, isHTMLElementClass, tagNameOf } from 'web-utility';

import { DataObject, VNode } from './dist/VDOM';

/**
 * @see {@link https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md}
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx}
 */
export function jsx(
    type: string | Function,
    { ref, is, style, children, ...props }: DataObject,
    key?: IndexKey
): VNode {
    if (typeof type === 'function' && isHTMLElementClass(type))
        type = tagNameOf(type);

    children = [children]
        .flat(Infinity)
        .map(node =>
            node instanceof Object
                ? new VNode(node)
                : node === 0 || node
                  ? new VNode({ text: node.toString() })
                  : undefined
        )
        .filter(Boolean);

    const commonProps: VNode = { key, ref, is, style, children };

    return typeof type === 'string'
        ? new VNode({ ...commonProps, tagName: type, props })
        : type({ ...commonProps, ...props });
}

export const jsxs = jsx;
export const jsxDEV = jsx;

/**
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx#react-automatic-runtime-1}
 */
export const Fragment = ({
    key,
    ref,
    is,
    style,
    children,
    ...props
}: VNode['props'] & Omit<VNode, 'props'>) =>
    new VNode({
        key,
        ref,
        is,
        props: isEmpty(props) ? undefined : props,
        style,
        children
    });
