import { JSDOM } from 'jsdom';

export default JSDOM;

const { window } = new JSDOM('', {
    url: 'http://test.com/',
    pretendToBeVisual: true
});

[
    'self',
    'document',
    'Node',
    'Element',
    'HTMLElement',
    'DocumentFragment',
    'DOMParser',
    'XMLSerializer',
    'NodeFilter',
    'InputEvent',
    'CustomEvent'
].forEach(key => (global[key] = window[key]));

/**
 * @private
 *
 * @param {HTMLElement} input
 * @param {String}      raw
 *
 * @emits {InputEvent} `input`
 *
 * @return {Promise}
 */
export async function typeIn(input, raw) {
    for (let data of raw) {
        input.value += data;

        input.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                composed: true,
                data
            })
        );

        await new Promise(resolve => setTimeout(resolve));
    }
}
