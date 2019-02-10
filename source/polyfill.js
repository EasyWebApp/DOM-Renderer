import { JSDOM } from 'jsdom';

export default JSDOM;

const { window } = new JSDOM('', {
    url: 'http://test.com/',
    pretendToBeVisual: true
});

for (let key of [
    'self',
    'document',
    'DocumentFragment',
    'DOMParser',
    'NodeFilter'
])
    global[key] = window[key];
