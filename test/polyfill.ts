import { JSDOM } from 'jsdom';

const { window } = new JSDOM();

for (const key of ['window', 'document', 'customElements'])
    global[key] = window[key];
