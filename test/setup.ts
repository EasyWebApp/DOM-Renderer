import { GlobalRegistrator } from '@happy-dom/global-registrator';
import type { Window } from 'happy-dom';
import { after, before } from 'node:test';
import { clearInterval, clearTimeout, setInterval, setTimeout } from 'node:timers';

declare global {
    var happyDOM: Window['happyDOM'];
}

const { MessageChannel, queueMicrotask } = globalThis;
const channels = new Set<MessageChannel>();

GlobalRegistrator.register();

// Keep the test runner's scheduling outside Happy DOM's task cancellation.
Object.assign(globalThis, { clearInterval, clearTimeout, queueMicrotask, setInterval, setTimeout });

// scheduler-polyfill creates a persistent channel that Node's runner does not close.
globalThis.MessageChannel = class extends MessageChannel {
    constructor() {
        super();
        channels.add(this);
    }
};

before(async () => {
    const { getHTML } = await import('declarative-shadow-dom-polyfill');
    const nativeGetHTML = Element.prototype.getHTML;

    // Happy DOM 21 ignores explicitly supplied closed roots. Keep native serialization
    // for ordinary markup (innerHTML calls getHTML), and use the polyfill for roots.
    Element.prototype.getHTML = function (options) {
        return options?.shadowRoots?.length
            ? getHTML.call(this, options)
            : nativeGetHTML.call(this, options);
    };
});

after(async () => {
    for (const { port1, port2 } of channels) {
        port1.close();
        port2.close();
    }
    await happyDOM.waitUntilComplete();
    await GlobalRegistrator.unregister();
    globalThis.MessageChannel = MessageChannel;
});
