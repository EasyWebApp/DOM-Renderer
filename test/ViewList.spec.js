import { parseDOM } from '../source/DOM/parser';

import ViewList from '../source/view/ViewList';

import View from '../source/view/View';

const root = parseDOM(`<ul data-view="browser">
    <template>
        <li>\${view.name}</li>
    </template>
</ul>`).firstChild,
    data = [
        { name: 'Chrome' },
        { name: 'Firefox' },
        { name: 'Opera' },
        { name: 'Edge' },
        { name: 'Safari' }
    ];

/**
 * @test {ViewList}
 */
describe('View list', () => {
    var list;
    /**
     * @test {ViewList#constructor}
     */
    it('creates a View list', () => {
        list = new ViewList(root, { browser: [...data] });

        list.should.have.length(0);
        root.childNodes.should.have.length(3);
    });

    /**
     * @test {ViewList#insert}
     */
    it('pushes an item', async () => {
        await list.insert(data[0]);

        list.should.have.length(1);
        root.childNodes.should.have.length(6);

        list[0].should.be.instanceOf(View);
        (list[0] + '').trim().should.be.equal('<li>Chrome</li>');
        list.data[0].should.be.equal(list[0].data);
    });

    /**
     * @test {ViewList#insert}
     */
    it('pushes another item', async () => {
        await list.insert(data[2]);

        list.should.have.length(2);
        root.childNodes.should.have.length(9);

        list[1].should.be.instanceOf(View);
        (list[1] + '').trim().should.be.equal('<li>Opera</li>');
        list.data[1].should.be.equal(list[1].data);
    });

    /**
     * @test {ViewList#insert}
     */
    it('inserts an item', async () => {
        await list.insert(data[1], 1);

        list.should.have.length(3);
        root.childNodes.should.have.length(12);

        list[1].should.be.instanceOf(View);
        (list[1] + '').trim().should.be.equal('<li>Firefox</li>');
        list.data[1].should.be.equal(list[1].data);
    });

    /**
     * @test {ViewList#toString()}
     * @test {ViewList#valueOf()}
     */
    it('generates HTML source & JSON data', () => {
        (list + '').should.be.equal(`<ul data-view="browser">
    <template>
        <li>\${view.name}</li>
    </template>
        <li>Chrome</li>
        <li>Firefox</li>
        <li>Opera</li>
</ul>`);

        list.valueOf().should.be.eql(data.slice(0, -2));
    });

    /**
     * @test {ViewList#clear}
     * @test {ViewList#render}
     */
    it('renders several items', async () => {
        await list.render(data.slice(-2));

        list.should.have.length(2);
        root.childNodes.should.have.length(9);

        (list + '').should.be.equal(`<ul data-view="browser">
    <template>
        <li>\${view.name}</li>
    </template>
        <li>Edge</li>
        <li>Safari</li>
</ul>`);
    });
});
