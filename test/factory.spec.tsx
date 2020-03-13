import './polyfill';
import { createCell } from '../source';

describe('JSX Factory method', () => {
    it('should accept a Standard HTML Tag', () => {
        expect(<a>test</a>).toEqual(
            expect.objectContaining({
                tagName: 'a',
                childNodes: ['test']
            })
        );
    });

    it('should accept a Function Component', () => {
        const Test = ({ children }) => <a>{children}</a>;

        expect(<Test>test</Test>).toEqual(
            expect.objectContaining({
                tagName: 'a',
                childNodes: ['test']
            })
        );
    });

    it('should accept a Class Component', () => {
        class Test extends HTMLElement {}

        customElements.define('x-test', Test);

        expect(<Test />).toEqual(
            expect.objectContaining({
                tagName: 'x-test',
                childNodes: []
            })
        );
    });
});
