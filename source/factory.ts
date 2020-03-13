import { CustomElementClass, VChild, VNode } from './type';

export function createCell(
    tag: string | Function | CustomElementClass,
    data?: any,
    ...childNodes: VChild[]
): VNode {
    if (typeof tag === 'function') {
        try {
            const node = new (tag as CustomElementClass)();

            if (node instanceof HTMLElement) tag = node.tagName.toLowerCase();
        } catch {}

        if (typeof tag === 'function') return (tag as Function)(data);
    }

    return { ...data, tagName: tag, childNodes };
}
