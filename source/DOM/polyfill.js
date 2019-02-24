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
export function typeIn(input, raw) {
    return Promise.all(
        Array.from(
            raw,
            data =>
                new Promise(resolve =>
                    setTimeout(() => {
                        input.value += data;

                        input.dispatchEvent(
                            new InputEvent('input', {
                                bubbles: true,
                                composed: true,
                                data
                            })
                        );

                        resolve();
                    })
                )
        )
    );
}
