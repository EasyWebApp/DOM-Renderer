/**
 * A composite Input Event with Input Method & Clipboard supported
 */
export default class CustomInputEvent extends CustomEvent {
    /**
     * @type {HTMLElement}
     */
    get target() {
        var node = super.target;

        if (this.composed) {
            const root = node.getRootNode();

            if (root instanceof DocumentFragment) return root.host;
        }

        return node;
    }
}

function customInput(element, detail) {
    element.dispatchEvent(
        new CustomInputEvent('input', {
            bubbles: true,
            composed: true,
            detail
        })
    );
}

/**
 * @param {HTMLElement} element
 *
 * @listens {InputEvent}       - `input` event
 * @listens {CompositionEvent} - `compositionstart` & `compositionend` event
 * @listens {ClipboardEvent}   - `paste` event
 * @listens {ClipboardEvent}   - `cut` event
 *
 * @emits {CustomInputEvent}
 */
export function watchInput(element) {
    var IME, clipBoard;

    element.addEventListener('compositionstart', () => (IME = true));

    element.addEventListener(
        'compositionend',
        ({ target, data }) => ((IME = false), customInput(target, data))
    );

    element.addEventListener('input', event => {
        if (event instanceof CustomInputEvent) return;

        if (clipBoard) clipBoard = false;
        else if (!IME) customInput(event.target, event.data);
    });

    element.addEventListener('paste', ({ target, clipboardData }) => {
        if (!IME)
            (clipBoard = true),
            customInput(target, clipboardData.getData('text'));
    });

    element.addEventListener('cut', ({ target }) => {
        if (!IME) (clipBoard = true), customInput(target);
    });
}
