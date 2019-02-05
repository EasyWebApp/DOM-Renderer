import { readFileSync } from 'fs-extra';

import {
    parseDOM,
    walkDOM,
    scanTemplate,
    stringifyDOM
} from '../source/utility';

import Template from '../source/Template';

var template = readFileSync('test/source/index.html') + '',
    fragment;

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
        Array.from(walkDOM(fragment), ({ nodeName }) => nodeName).should.be.eql(
            [
                '#document-fragment',
                '#text',
                'H1',
                '#text',
                '#text',
                'UL',
                '#text',
                'TEMPLATE',
                '#text',
                '#text',
                'OL',
                '#text',
                'TEMPLATE',
                '#text',
                '#text'
            ]
        );
    });

    /**
     * @test {scanTemplate}
     */
    it('Template scanning', () => {
        const key_node = [];

        scanTemplate(fragment, Template.Expression, '[data-view]', {
            attribute(node) {
                key_node.push(node.value);
            },
            text(node) {
                key_node.push(node.nodeValue.trim());
            },
            view(node) {
                key_node.push(node.tagName);
            }
        });

        key_node.should.be.eql([
            '${! view.name}',
            'Hello, ${view.name} !',
            'UL',
            'OL'
        ]);
    });
});
