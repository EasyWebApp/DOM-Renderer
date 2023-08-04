import { DOMRenderer } from '../source/dist';
import { jsx, Fragment } from '../source/jsx-runtime';

describe('JSX runtime', () => {
    const renderer = new DOMRenderer();

    it('should render JSX to DOM', () => {
        renderer.render(
            jsx('a', {
                href: 'https://idea2.app/',
                style: { color: 'red' },
                children: ['idea2app']
            })
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: red;">idea2app</a>'
        );
    });

    it('should render JSX fragment to DOM', () => {
        renderer.render(
            jsx(Fragment, {
                children: [
                    jsx('a', {
                        href: 'https://idea2.app/',
                        style: { color: 'blue' },
                        children: ['idea2app']
                    })
                ]
            })
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: blue;">idea2app</a>'
        );
    });

    it('should render a Web components class', () => {
        class MyTag extends HTMLElement {}

        customElements.define('my-tag', MyTag);

        renderer.render(jsx(MyTag, {}));

        expect(document.body.innerHTML).toBe('<my-tag></my-tag>');
    });

    it('should render an HTML tag extended by a Web components class', () => {
        class MyDiv extends HTMLDivElement {}

        customElements.define('my-div', MyDiv, { extends: 'div' });

        renderer.render(jsx('div', { is: 'my-div' }));

        expect(document.body.innerHTML).toBe('<div is="my-div"></div>');
    });

    it('should ignore Empty values except 0', () => {
        renderer.render(
            jsx(Fragment, { children: [0, false, null, undefined, NaN] })
        );
        expect(document.body.innerHTML).toBe('0');
    });

    it('should render Non-empty Primitive values', () => {
        renderer.render(jsx(Fragment, { children: [1, true] }));

        expect(document.body.innerHTML).toBe('1true');
    });

    it('should render DataSet & ARIA attributes', () => {
        renderer.render(
            jsx('div', { 'data-id': 'idea2app', 'aria-label': 'idea2app' })
        );
        expect(document.body.innerHTML).toBe(
            '<div data-id="idea2app" aria-label="idea2app"></div>'
        );
        // To Do: https://github.com/jsdom/jsdom/issues/3323

        // renderer.render(jsx('div', { ariaLabel: 'fCC' }));

        // expect(document.body.innerHTML).toBe('<div aria-label="fCC"></div>');
    });

    it('should call Event handlers', () => {
        const onClick = jest.fn();

        renderer.render(jsx('i', { onClick }));

        document.querySelector('i')?.click();

        expect(onClick).toBeCalledTimes(1);
    });

    it('should pass a real DOM Node by callbacks', () => {
        const ref = jest.fn();

        renderer.render(jsx('b', { ref, unRef: ref }));

        const { firstChild } = document.body;

        expect(document.body.innerHTML).toBe('<b></b>');

        expect(ref).toBeCalledWith(firstChild);

        renderer.render(jsx('a', {}));

        expect(document.body.innerHTML).toBe('<a></a>');

        expect(ref).toBeCalledWith(firstChild);
    });

    it('should reuse similar DOM nodes', () => {
        const renderList = (offset = 0) =>
            renderer.render(
                jsx('ul', {
                    children: Array.from(new Array(2), (_, index) => {
                        const key = String.fromCodePoint(
                            'a'.charCodeAt(0) + index + offset
                        );
                        return jsx('li', { children: [key] }, key);
                    })
                })
            );
        renderList();

        expect(document.body.innerHTML).toBe('<ul><li>a</li><li>b</li></ul>');

        const { children } = document.body.firstElementChild!;

        renderList(2);

        expect(document.body.innerHTML).toBe('<ul><li>c</li><li>d</li></ul>');

        expect([...document.body.firstElementChild!.children]).toEqual([
            ...children
        ]);
    });

    it('should render to a Static String', () => {
        expect(renderer.renderToStaticMarkup(jsx('i', {}))).toBe('<i></i>');
    });
});
