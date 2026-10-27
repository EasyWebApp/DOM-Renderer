import expect from 'expect';

import { VNode } from './dist';

function matchProperties(actual: unknown, expected: unknown) {
    if (expected === undefined) return;

    if (expected === null || typeof expected !== 'object') return expect(actual).toEqual(expected);

    expect(actual).not.toBeNull();
    expect(typeof actual).toBe('object');

    if (Array.isArray(expected)) expect(Array.isArray(actual)).toBe(true);

    for (const key of Object.keys(expected))
        matchProperties(
            (actual as Record<string, unknown>)[key],
            (expected as Record<string, unknown>)[key]
        );
}

function properties({ props = {}, is, style }: VNode) {
    const result: Record<string, unknown> = { is, style };

    for (const [key, value] of Object.entries(props)) {
        const name =
            VNode.propsMap[key] ||
            (/^aria[A-Z]/.test(key)
                ? key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
                : key);

        result[name] =
            name === 'class' && typeof value === 'string'
                ? value.trim().replace(/\s+/g, ' ')
                : value;
    }
    return result;
}

/**
 * Assert utility for the {@link VNode} of DOM Renderer v2
 *
 * @see {@link https://github.com/jvanbruegge/snabbdom-looks-like/pull/2}
 * @see {@link https://github.com/EasyWebApp/snabbdom-looks-like}
 */
export function assertLooksLike(actual: VNode | string, expected: VNode | string): void {
    if (typeof actual === 'string' || typeof expected === 'string')
        return expect(actual).toEqual(expected);

    expect(actual.tagName?.toLowerCase()).toBe(expected.tagName?.toLowerCase());
    expect(actual.text).toBe(expected.text);
    matchProperties(properties(actual), properties(expected));

    const actualChildren = actual.children || [];
    const expectedChildren = expected.children || [];

    expect(actualChildren).toHaveLength(expectedChildren.length);

    for (let index = 0; index < expectedChildren.length; index++)
        assertLooksLike(actualChildren[index], expectedChildren[index]);
}
