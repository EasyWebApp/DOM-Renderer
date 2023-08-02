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
});
