import { readFileSync } from 'fs-extra';

import { parseDOM, walkDOM } from '../source/utility';

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
});
