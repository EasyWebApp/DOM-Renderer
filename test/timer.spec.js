import { spy } from 'sinon';

import { debounce, delay, throttle } from '../source';

describe('DOM timer', () => {
    /**
     * @test {debounce}
     */
    it('Debounce', async () => {
        const origin = spy();

        const wrapped = debounce(origin);

        for (let index of [1, 2, 3]) {
            wrapped(index);
            await delay(0.05);
        }
        await delay(0.2);

        origin.should.be.calledOnce();
        origin.should.be.calledWith(3);
    });

    /**
     * @test {throttle}
     */
    it('Throttle', async () => {
        const origin = spy(index => index),
            result = [];

        const wrapped = throttle(origin, 0.05);

        for (let index of [1, 2, 3, 4]) {
            result.push(wrapped(index));
            await delay(0.025);
        }

        origin.should.be.calledTwice();
        result.should.be.eql([1, 1, 3, 3]);
    });
});
