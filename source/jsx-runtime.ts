import { IndexKey } from 'web-utility';

import { DataObject, VNode } from './VDOM';

/**
 * @see {@link https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md}
 * @see {@link https://babeljs.io/docs/babel-plugin-transform-react-jsx}
 */
export const jsx = (
    type: string | Function,
    { style, children, ...props }: DataObject,
    key?: IndexKey
): VNode =>
    typeof type === 'string'
        ? {
              key,
              tagName: type,
              props,
              style,
              children: (children instanceof Array
                  ? children
                  : children && [children]
              )
                  ?.map(node =>
                      typeof node === 'string' ? { text: node } : node
                  )
                  .flat(Infinity)
          }
        : type({ style, children, ...props });

export const jsxs = jsx;
