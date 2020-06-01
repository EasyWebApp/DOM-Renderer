import { find, clearList } from '../source/utility';

describe('Utility methods', () => {
    it('should find an Item from Array-like objects with Index Offset', () => {
        expect(
            find(
                document.documentElement.childNodes,
                ({ nodeName }) => nodeName.toLowerCase() === 'body',
                1
            )
        ).toBe(document.body);
    });

    it('should clear & flatten an Array', () => {
        expect(
            clearList<number>([1, [null, [2, [NaN, 3]]]])
        ).toEqual(expect.arrayContaining([1, 2, 3]));
    });
});
