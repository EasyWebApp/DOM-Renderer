import './polyfill';
import { update, createCell } from '../source';

describe('Renderer methods', () => {
    document.body.innerHTML = '<a title="test" />';

    it('should update a Standard HTML Tag', () => {
        update(document.body.firstElementChild, <a href="#">test</a>);

        expect(document.body.innerHTML).toBe('<a href="#">test</a>');
    });

    it('should relpace an old HTML Tag', () => {
        update(
            document.body.firstElementChild,
            <ol>
                <li id="item-1">1</li>
                <li id="item-0">0</li>
            </ol>
        );

        expect(document.body.innerHTML).toBe(
            '<ol><li id="item-1">1</li><li id="item-0">0</li></ol>'
        );
    });

    it('should relpace an old HTML Tag', () => {
        const root = document.body.firstElementChild;
        const last = root.lastElementChild;

        update(
            document.body.firstElementChild,
            <ol>
                <li id="item-0">0</li>
            </ol>
        );

        expect(root.outerHTML).toBe('<ol><li id="item-0">0</li></ol>');
        expect(root.lastElementChild).toBe(last);
    });
});
