import { readFileSync } from 'fs-extra';

import { parseDOM, walkDOM, scanTemplate } from '../source/utility';

import Template from '../source/Template';

var fragment;

describe('DOM utility', () => {
    /**
     * @test {parseDOM}
     */
    it('DOM parsing', () => {
        fragment = parseDOM(readFileSync('test/source/index.html'));

        fragment.should.be.instanceOf(DocumentFragment);

        fragment.firstElementChild.tagName.should.be.equal('TEMPLATE');

        fragment = fragment.firstElementChild.content;
    });

    /**
     * @test {walkDOM}
     */
    it('DOM walking', () => {
        Array.from(walkDOM(fragment), ({ nodeName }) =>
            nodeName.toLowerCase()
        ).should.be.eql([
            '#document-fragment',
            '#text',
            'h1',
            '#text',
            '#text',
            'ul',
            '#text',
            'template',
            '#text',
            '#text',
            'ol',
            '#text',
            'template',
            '#text',
            '#text'
        ]);
    });

    /**
     * @test {scanTemplate}
     */
    it('Template scanning', () => {
        const key_node = [];

        scanTemplate(
            fragment,
            Template.Expression,
            '[data-object], [data-array]',
            {
                attribute(node) {
                    key_node.push(node.value);
                },
                text(node) {
                    key_node.push(node.nodeValue.trim());
                },
                view(node) {
                    key_node.push(node.tagName);
                }
            }
        );

        key_node.should.be.eql([
            '${! view.name}',
            'Hello, ${view.name} !',
            'UL',
            'OL'
        ]);
    });
});
