import 'core-js/es/array/flat';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM();

for (const key of ['window', 'document', 'HTMLElement', 'customElements'])
    global[key] = window[key];
