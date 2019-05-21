import { likeArray, insertableIndexOf } from '../source/object/array';

describe('Array utility methods', () => {
    /**
     * @test {likeArray}
     */
    it('detects Array-like object', () => {
        likeArray(false).should.be.false();
        likeArray(null).should.be.false();
        likeArray(undefined).should.be.false();
        likeArray(NaN).should.be.false();
        likeArray('').should.be.false();

        likeArray([]).should.be.true();
        likeArray({ length: 0 }).should.be.true();

        likeArray(() => {}).should.be.false();
        likeArray(document.createElement('form')).should.be.false();
    });

    /**
     * @test {insertableIndexOf}
     */
    it('gets insertable index of an Array', () => {
        const list = [1, 2, 3];

        insertableIndexOf(list, 1).should.be.equal(1);

        insertableIndexOf(list, 4).should.be.equal(3);

        insertableIndexOf(list, -1).should.be.equal(2);
    });
});
