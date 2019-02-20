import { spy } from 'sinon';

import Template from '../source/Template';

var onChange = spy(),
    template;

/**
 * @test {Template}
 */
describe('Template evaluator', () => {
    /**
     * @test {Template#evaluatorOf}
     */
    it('Parsing', () => {
        template = new Template(
            'test${this.test},example${view.example}',
            ['view'],
            onChange
        );

        template.should.have.length(2);

        template[0].should.be.instanceOf(Function);

        onChange.should.be.calledWith('test,example', null);
    });

    /**
     * @test {Template#reset}
     */
    it('No changing', () => {
        template.reset();

        onChange.should.be.calledOnce();
    });

    /**
     * @test {Template#evaluate}
     */
    it('Evaluating', () => {
        template.valueOf().should.be.equal('test,example');

        template
            .evaluate({ test: 1 }, { example: 2 })
            .should.be.equal('test1,example2');

        onChange.should.be.calledWith('test1,example2', 'test,example');
    });
});
