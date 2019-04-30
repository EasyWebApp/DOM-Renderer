/**
 * @type {Object}
 */
export const attributeMap = {
    class: 'className',
    for: 'htmlFor',
    readonly: 'readOnly'
};

const HTML_page = /<!?(DocType|html|head|body|meta|title|base)[\s\S]*?>/,
    parser = new DOMParser();

/**
 * @param {String} markup - HTML/XML source code
 *
 * @return {Document|DocumentFragment}
 */
export function parseDOM(markup) {
    return HTML_page.test(markup)
        ? parser.parseFromString(markup, 'text/html')
        : Object.assign(document.createElement('template'), {
            innerHTML: markup
        }).content;
}

const Document_Level = ['#document', 'html', 'head', 'body'],
    serializer = new XMLSerializer(),
    documentXML = document.implementation.createDocument(null, 'xml', null);

function stringOf(node) {
    if (node.querySelectorAll)
        Array.from(
            node.querySelectorAll('style:not(:empty), script:not(:empty)'),
            ({ textContent, firstChild }) =>
                textContent.trim() &&
                firstChild.replaceWith(
                    documentXML.createCDATASection(textContent)
                )
        );

    return serializer.serializeToString(node);
}

/**
 * @param {Node|Node[]} list
 *
 * @return {String} HTML/XML source code
 */
export function stringifyDOM(list) {
    if (list instanceof HTMLElement) return list.outerHTML;

    if (list instanceof Node) {
        if (Document_Level.includes(list.nodeName.toLowerCase()))
            return stringOf(list);

        list = [list];
    }

    const box = document.createElement('div');

    box.append.apply(box, Array.from(list, node => node.cloneNode(true)));

    return box.innerHTML;
}

/**
 * @param {Node}                         root
 * @param {function(node: Node): Number} [filter] - https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter/acceptNode
 * @param {Boolean}                      [sub]    - Go into Sub DOM
 *
 * @yield {Node}
 */
export function* walkDOM(root, filter, sub) {
    var iterator = document.createNodeIterator(root, NodeFilter.SHOW_ALL, {
            acceptNode:
                filter instanceof Function
                    ? filter
                    : () => NodeFilter.FILTER_ACCEPT
        }),
        node;

    while ((node = iterator.nextNode())) {
        yield node;

        if (!sub) continue;

        const subDOM = node.content || node.shadowRoot;

        if (subDOM instanceof DocumentFragment)
            yield* walkDOM(subDOM, filter, sub);
    }
}

/**
 * @param {Node}                                 root
 * @param {RegExp}                               expression
 * @param {Object}                               parser
 * @param {function(attr: Attr): void}           parser.attribute
 * @param {function(text: Text): void}           parser.text
 * @param {... function(node: Element): Boolean} parser.element - Key for CSS selector, Value for Callback
 */
export function scanDOM(root, expression, { attribute, text, ...element }) {
    function scanAttr(node) {
        Array.from(node.attributes).forEach(
            attr => expression.test(attr.value) && attribute(attr)
        );
    }

    const iterator = walkDOM(root, node => {
        if (node.matches) {
            scanAttr(node);

            for (let selector in element)
                if (node.matches(selector) && element[selector](node) === false)
                    return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
    });

    Array.from(iterator, node => {
        switch (node.nodeType) {
            case 1:
                scanAttr(node);
                break;
            case 3:
                if (expression.test(node.nodeValue)) text(node);
        }
    });
}

/**
 * @param {HTMLElement} input
 *
 * @return {String|String[]}
 */
export function valueOf(input) {
    switch (input.type || input.tagName.toLowerCase()) {
        case 'radio':
            return input.checked ? input.value : null;
        case 'checkbox':
            return Array.from(
                input.form
                    ? input.form.elements[input.name]
                    : input
                        .getRootNode()
                        .querySelectorAll(
                            `input[type="checkbox"][name="${input.name}"]`
                        ),
                node => (node.checked ? node.value : null)
            );
        case 'select':
            return input.multiple
                ? Array.from(input.options, node =>
                    node.selected ? node.value : null
                )
                : input.value;
    }

    return input.value;
}
