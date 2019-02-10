import { readFileSync, readJSONSync } from 'fs-extra';

import { parseDOM } from '../source/utility';

import View from '../source/View';

var view = parseDOM(readFileSync('test/source/index.html')).firstElementChild
        .innerHTML,
    data = readJSONSync('test/source/index.json');

describe('DOM View', () => {
    /**
     * @test {View#parseTree}
     */
    it('Parsing', () => {
        view = new View(view);

        Array.from(view, ({ type }) => type).should.match([
            'Attr',
            'Text',
            'View',
            'View'
        ]);
    });

    /**
     * @test {View#render}
     */
    it('Rendering', () => {
        (view.render(data) + '').should.be.equal(`
    <h1>TechQuery</h1>

    <ul data-view="profile">
        <template>
            <li title="\${scope.name}">
                \${view.URL}
            </li>
            <li>\${view.title}</li>
        </template>
    <li title="TechQuery">https://tech-query.me/</li>
            <li>Web/JavaScript full-stack engineer</li></ul>

    <ol data-view="job">
        <template>
            <li>\${view.title}</li>
        </template>
    <li>freeCodeCamp</li><li>MVP</li><li>KaiYuanShe</li></ol>
`);
    });

    function getLasts() {
        return view.topNodes
            .map(node => node.nodeType === 1 && node.lastChild)
            .filter(Boolean);
    }

    /**
     * @test {Model#patch}
     */
    it('Updating', () => {
        const last = getLasts(),
            _data_ = Object.assign({}, data);

        _data_.name = 'tech-query';
        delete _data_.profile;
        _data_.job = null;

        view.render(_data_);

        const now = getLasts();

        now[0].should.not.be.equal(last[0]);
        now[1].should.be.equal(last[1]);
        now[2].nodeName.should.not.be.equal('LI');

        (view + '').should.be.equal(`
    <h1>tech-query</h1>

    <ul data-view="profile">
        <template>
            <li title="\${scope.name}">
                \${view.URL}
            </li>
            <li>\${view.title}</li>
        </template>
    <li title="TechQuery">https://tech-query.me/</li>
            <li>Web/JavaScript full-stack engineer</li></ul>

    <ol data-view="job">
        <template>
            <li>\${view.title}</li>
        </template>
    </ol>
`);
    });
});
