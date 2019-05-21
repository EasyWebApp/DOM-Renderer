import { parseDOM } from '../source/DOM/parser';

import { indexOf, insertTo, valueOf } from '../source/DOM/manipulate';

const form = parseDOM(`<form>
    <input type="radio" name="radio" value="r1" checked>
    <input type="radio" name="radio" value="r2">

    <input type="checkbox" name="check" value="c1" checked>
    <input type="checkbox" name="check" value="c2">
    <input type="checkbox" name="check" value="c3" checked>

    <select name="select" multiple>
        <option>s1</option>
        <option selected>s2</option>
        <option selected>s3</option>
    </select>

    <textarea name="text">example</textarea>
</form>`).firstChild;

describe('DOM inserting', () => {
    /**
     * @test {indexOf}
     */
    it('gets the index of DOM nodes', () => {
        indexOf(form.firstElementChild).should.be.equal(0);

        indexOf(form.firstElementChild, true).should.be.equal(1);
    });

    /**
     * @test {insertTo}
     */
    it('inserts Nodes to an Element by index', () => {
        insertTo(form, 'test', -2, true);

        insertTo(form, 'test', Infinity, true);

        form.outerHTML.should.be.equal(`<form>
    <input type="radio" name="radio" value="r1" checked="">
    <input type="radio" name="radio" value="r2">

    <input type="checkbox" name="check" value="c1" checked="">
    <input type="checkbox" name="check" value="c2">
    <input type="checkbox" name="check" value="c3" checked="">

    <select name="select" multiple="">
        <option>s1</option>
        <option selected="">s2</option>
        <option selected="">s3</option>
    </select>

    test<textarea name="text">example</textarea>
test</form>`);
    });

    /**
     * @test {valueOf}
     */
    it('gets values of Form fields', () => {
        const { radio, check, select, text } = form.elements;

        valueOf(radio).should.be.equal('r1');
        valueOf(check).should.be.eql(['c1', 'c3']);
        valueOf(select).should.be.eql(['s2', 's3']);
        valueOf(text).should.be.equal('example');
    });
});
