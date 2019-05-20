import { parseDOM } from '../source/DOM/parser';

import { indexOf, insertableIndexOf, insertTo } from '../source/DOM/insert';

const tree = parseDOM(`<div>
    <span>test</span>
</div>`).firstChild;

describe('DOM inserting', () => {
    /**
     * @test {indexOf}
     */
    it('gets the index of DOM nodes', () => {
        indexOf(tree.firstElementChild).should.be.equal(0);

        indexOf(tree.lastChild, true).should.be.equal(2);
    });

    /**
     * @test {insertableIndexOf}
     */
    it('gets insertable index of Node list', () => {
        insertableIndexOf(tree.childNodes, 1).should.be.equal(1);

        insertableIndexOf(tree.childNodes, 4).should.be.equal(3);

        insertableIndexOf(tree.childNodes, -1).should.be.equal(2);
    });

    /**
     * @test {insertTo}
     */
    it('inserts Nodes to an Element by index', () => {
        insertTo(tree, 'test', -2, true);

        insertTo(tree, 'test', 10, true);

        tree.outerHTML.should.be.equal(`<div>
    test<span>test</span>
test</div>`);
    });
});
