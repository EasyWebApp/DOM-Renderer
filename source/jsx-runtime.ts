import { IndexKey, isHTMLElementClass, tagNameOf } from 'web-utility';

import { DataObject, VDOMNode, VNode } from './dist/VDOM';

/**
 * @see {@link https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md}
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx}
 */
export function jsx(
    type: string | Function,
    { is, style, children, ...props }: DataObject,
    key?: IndexKey
): VNode {
    if (typeof type === 'function' && isHTMLElementClass(type))
        type = tagNameOf(type);

    children = (
        children instanceof Array ? children : children && [children]
    )?.map(node =>
        node instanceof Object
            ? node
            : node === 0 || node
            ? { text: node + '' }
            : { text: '' }
    );
    return typeof type === 'string'
        ? {
              key,
              selector: VDOMNode.selectorOf(type, is, props.className),
              tagName: type,
              is,
              props,
              style,
              children
          }
        : type({ is, style, children, ...props });
}

export const jsxs = jsx;

/**
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx#react-automatic-runtime-1}
 */
export const Fragment = ({
    style,
    children,
    ...props
}: VNode['props'] & Pick<VNode, 'style' | 'children'>): VNode => ({
    props,
    style,
    children
});
