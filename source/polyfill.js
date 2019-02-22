import { JSDOM } from 'jsdom';

export default JSDOM;

const { window } = new JSDOM('', {
    url: 'http://test.com/',
    pretendToBeVisual: true
});

for (let key of [
    'self',
    'document',
    'Node',
    'HTMLElement',
    'DocumentFragment',
    'DOMParser',
    'XMLSerializer',
    'NodeFilter',
    'CustomEvent'
])
    global[key] = window[key];
