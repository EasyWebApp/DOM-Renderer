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

/**
 * @param {Node} root
 *
 * @yield {Node}
 */
export function* walkDOM(root) {
    var iterator = document.createNodeIterator(root),
        node;

    while ((node = iterator.nextNode())) yield node;
}
