import 'declarative-shadow-dom-polyfill';

import { DOMRenderer } from '../source/dist';

class MyTag extends HTMLElement {}

customElements.define('my-tag', MyTag);

declare global {
    interface HTMLElementTagNameMap {
        'my-tag': MyTag;
    }
}

describe('JSX runtime', () => {
    const renderer = new DOMRenderer();

    it('should render JSX to DOM', () => {
        renderer.render(
            <a href="https://idea2.app/" style={{ color: 'red' }}>
                idea2app
            </a>
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: red;">idea2app</a>'
        );
    });

    it('should render JSX fragment to DOM', () => {
        renderer.render(
            <>
                <a href="https://idea2.app/" style={{ color: 'blue' }}>
                    idea2app
                </a>
            </>
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: blue;">idea2app</a>'
        );
    });

    it('should render a Web components class', () => {
        renderer.render(<my-tag />);

        expect(document.body.innerHTML).toBe('<my-tag></my-tag>');
    });

    it('should render an HTML tag extended by a Web components class', () => {
        class MyDiv extends HTMLDivElement {}

        customElements.define('my-div', MyDiv, { extends: 'div' });

        renderer.render(<div is="my-div" />);

        expect(document.body.innerHTML).toBe('<div is="my-div"></div>');
    });

    it('should ignore Empty values except 0', () => {
        renderer.render(
            <>
                {0}
                {false}
                {null}
                {undefined}
                {NaN}
            </>
        );
        expect(document.body.innerHTML).toBe('0');
    });

    it('should render Non-empty Primitive values', () => {
        renderer.render(
            <>
                {1}
                {true}
            </>
        );
        expect(document.body.innerHTML).toBe('1true');
    });

    it('should render DataSet & ARIA attributes', () => {
        renderer.render(<div data-id="idea2app" aria-label="idea2app" />);

        expect(document.body.innerHTML).toBe(
            '<div data-id="idea2app" aria-label="idea2app"></div>'
        );
        // To Do: https://github.com/jsdom/jsdom/issues/3323

        // renderer.render(<div ariaLabel="fCC"></div>);

        // expect(document.body.innerHTML).toBe('<div aria-label="fCC"></div>');
    });

    it('should call Event handlers', () => {
        const onClick = jest.fn();

        renderer.render(<i onClick={onClick} />);

        document.querySelector('i')?.click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should toggle a real DOM Node by callbacks', () => {
        const ref = jest.fn();

        renderer.render(<b ref={ref} />);

        const { firstChild } = document.body;

        expect(document.body.innerHTML).toBe('<b></b>');

        expect(ref).toHaveBeenCalledWith(firstChild);

        renderer.render(<a />);

        expect(document.body.innerHTML).toBe('<a></a>');

        expect(ref).toHaveBeenCalledWith();
    });

    it('should reuse similar DOM nodes', () => {
        const renderList = (offset = 0) =>
            renderer.render(
                <ul>
                    {Array.from({ length: 2 }, (_, index) => {
                        const key = String.fromCodePoint('a'.charCodeAt(0) + index + offset);

                        return <li key={key}>{key}</li>;
                    })}
                </ul>
            );
        renderList();

        expect(document.body.innerHTML).toBe('<ul><li>a</li><li>b</li></ul>');

        const { children } = document.body.firstElementChild!;

        renderList(2);

        expect(document.body.innerHTML).toBe('<ul><li>c</li><li>d</li></ul>');

        expect([...document.body.firstElementChild!.children]).toEqual([...children]);
    });

    it('should not share a real DOM with the same VDOM', () => {
        const sameVDOM = <a />;

        renderer.render(
            <>
                <nav>{sameVDOM}</nav>
                <nav>{sameVDOM}</nav>
            </>
        );
        expect(document.body.innerHTML).toBe('<nav><a></a></nav><nav><a></a></nav>');
    });

    it('should handle Nested children arrays', () => {
        renderer.render(
            <>
                <nav />
                {[<nav key="1" />]}
            </>
        );
        expect(document.body.innerHTML).toBe('<nav></nav><nav></nav>');
    });

    it('should render to a Static String', () => {
        expect(renderer.renderToStaticMarkup(<i />)).toBe('<i></i>');
    });

    it('should render SVG', () => {
        renderer.render(
            // copy from https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Getting_Started
            <svg version="1.1" width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="red" />

                <circle cx="150" cy="100" r="80" fill="green" />

                <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">
                    SVG
                </text>
            </svg>
        );
        expect(document.body.innerHTML).toBe(
            '<svg version="1.1" width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="red"></rect><circle cx="150" cy="100" r="80" fill="green"></circle><text x="150" y="125" font-size="60" text-anchor="middle" fill="white">SVG</text></svg>'
        );
        expect(document.body.firstElementChild).toBeInstanceOf(SVGSVGElement);
    });
});
