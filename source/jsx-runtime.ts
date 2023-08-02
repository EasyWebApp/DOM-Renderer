import { IndexKey, isHTMLElementClass, tagNameOf } from 'web-utility';

import { DataObject, VDOMNode, VNode } from './dist/VDOM';

/**
 * @see {@link https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md}
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx}
 */
export function jsx(
    type: string | Function,
    { style, children, ...props }: DataObject,
    key?: IndexKey
): VNode {
    if (typeof type === 'function' && isHTMLElementClass(type))
        type = tagNameOf(type);

    return typeof type === 'string'
        ? {
              key,
              selector: VDOMNode.selectorOf(type, props.className),
              tagName: type,
              props,
              style,
              children: (children instanceof Array
                  ? children
                  : children && [children]
              )?.map(node => (typeof node === 'string' ? { text: node } : node))
          }
        : type({ style, children, ...props });
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
