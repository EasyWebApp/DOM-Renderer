import {
    parseDOM,
    walkDOM,
    scanDOM,
    stringifyDOM
} from '../source/DOM/utility';

import Template from '../source/view/Template';

import template from './source/index.html';

var fragment;

describe('DOM utility', () => {
    /**
     * @test {parseDOM}
     */
    it('DOM parsing', () => {
        fragment = parseDOM(template);

        fragment.should.be.instanceOf(DocumentFragment);

        fragment.firstElementChild.tagName.should.be.equal('TEMPLATE');

        fragment = fragment.firstElementChild.content;
    });

    /**
     * @test {stringifyDOM}
     */
    it('DOM serialization', () => {
        stringifyDOM(fragment.childNodes).should.be.equal(
            /<template>([\s\S]+)<\/template>/.exec(template)[1]
        );
    });

    /**
     * @test {walkDOM}
     */
    it('DOM walking', () => {
        Array.from(
            walkDOM(fragment, null, true),
            ({ nodeValue, nodeName }) => (nodeValue || '').trim() || nodeName
        ).should.be.eql([
            '#document-fragment',
            '#text',
            'H1',
            'Hello, ${view.name} !',
            '#text',
            'UL',
            '#text',
            'TEMPLATE',
            '#document-fragment',
            '#text',
            'LI',
            '${view.URL}',
            '#text',
            'LI',
            '${view.title}',
            '#text',
            '#text',
            '#text',
            'OL',
            '#text',
            'TEMPLATE',
            '#document-fragment',
            '#text',
            'LI',
            '${view.title}',
            '#text',
            '#text',
            '#text',
            'TEXTAREA',
            '#text'
        ]);
    });

    /**
     * @test {scanDOM}
     */
    it('Template scanning', () => {
        const key_node = [];

        scanDOM(fragment, Template.Expression, {
            attribute(node) {
                key_node.push(node.value);
            },
            text(node) {
                key_node.push(node.nodeValue.trim());
            },
            ['[data-view]'](node) {
                key_node.push(node.tagName);

                return false;
            }
        });

        key_node.should.be.eql([
            '${! view.name}',
            'Hello, ${view.name} !',
            '${! view.name}',
            'UL',
            '${! view.name}',
            'OL'
        ]);
    });
});
