import { CustomElementClass, VChild, VNode } from './type';

const custom_cache = new WeakMap();

export function createCell(
    tag: string | Function | CustomElementClass,
    data?: any,
    ...children: VChild[]
): VNode {
    children = children.flat(Infinity);

    if (typeof tag === 'function') {
        let name = custom_cache.get(tag);

        if (name) tag = name;
        else
            try {
                const node = new (tag as CustomElementClass)();

                if (node instanceof HTMLElement) {
                    name = node.tagName.toLowerCase();

                    custom_cache.set(tag, (tag = name));
                }
            } catch {}

        if (typeof tag === 'function')
            return (tag as Function)({ ...data, children });
    }

    return { ...data, tagName: tag, childNodes: children };
}
