import { spy } from 'sinon';

import Model from '../source/Model';

import { nextTick } from '../source/utility';

const onCommit = spy();

const model = new Model({ test: 1 }, onCommit);

/**
 * @test {Model}
 */
describe('Data model', () => {
    /**
     * @test {Model#constructor}
     * @test {Model#valueOf}
     */
    it('Scope', () => {
        model.data.test.should.be.equal(1);

        model.valueOf().should.be.empty();
    });

    /**
     * @test {Model#patch}
     */
    it('Full update', () => {
        const data = { example: 2, sample: { a: 1, b: 2 } };

        const update = model.patch(data);

        update.test.should.be.equal(1);
        update.example.should.be.equal(2);
        update.sample.should.match(data.sample);
    });

    /**
     * @test {Model#patch}
     */
    it('Incremental update', () => {
        model
            .patch({ sample: null })
            .should.match({ example: 2, sample: null });
    });

    /**
     * @test {Model#watch}
     * @test {Model#commit}
     */
    it('Async update', async () => {
        ['test', 'example', 'sample'].forEach(key => model.watch(key));

        model.commit('test', 2);
        model.example = 3;

        await nextTick();

        model.sample = { a: 1 };

        onCommit.should.be.calledOnce();
        onCommit.should.be.calledWith({ test: 2, example: 3 });

        await nextTick();

        onCommit.should.be.calledTwice();
        onCommit.should.be.calledWith({ sample: { a: 1 } });
    });
});
