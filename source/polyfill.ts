import { Window } from 'happy-dom';

const window = new Window();

for (const key of [
    'window',
    'self',
    'XMLSerializer',
    'DOMParser',
    'NodeFilter',
    'Text',
    'Document',
    'document',
    'ShadowRoot',
    'Element',
    'HTMLElement',
    'HTMLUnknownElement'
])
    Reflect.set(globalThis, key, Reflect.get(window, key));
