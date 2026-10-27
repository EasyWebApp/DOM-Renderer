import { expect } from 'expect';
import { fn } from 'jest-mock';
import { describe, it } from 'node:test';

import { DOMRenderer, VNodeMeta } from '../source/dist';
import { Fragment, jsx, jsxDEV, jsxs } from '../source/jsx-runtime';

class MyTag extends HTMLElement {}

customElements.define('my-tag', MyTag);

declare global {
    interface HTMLElementTagNameMap {
        'my-tag': MyTag;
    }
}

describe('JSX runtime', () => {
    const renderer = new DOMRenderer();

    for (const { name, type } of [
        { name: 'native elements', type: 'button' },
        { name: 'function wrappers', type: (props: VNodeMeta) => jsx('button', props) },
        { name: 'Fragments', type: Fragment }
    ]) 
        describe(`key metadata for ${name}`, () => {
            for (const { props, argumentKey, expected } of [
                { props: { key: 'spread' }, argumentKey: undefined, expected: 'spread' },
                { props: {}, argumentKey: 'argument', expected: 'argument' },
                { props: { key: 'spread' }, argumentKey: 'argument', expected: 'spread' },
                { props: { key: undefined }, argumentKey: 'argument', expected: 'argument' },
                { props: { key: 0 }, argumentKey: 'argument', expected: 0 },
                { props: { key: '' }, argumentKey: 'argument', expected: '' },
                { props: {}, argumentKey: 0, expected: 0 },
                { props: {}, argumentKey: '', expected: '' }
            ]) {
                it(`should resolve props key ${String(props.key)} and argument key ${String(argumentKey)} to ${JSON.stringify(expected)}`, () => {
                    const node = jsx(type, props, argumentKey);

                    expect(node.key).toBe(expected);
                    expect(node.props || {}).not.toHaveProperty('key');
                });
            }
        });
    

    it('should let a later spread override an explicit JSX key', () => {
        const props: Pick<VNodeMeta, 'key'> = { key: 'b' };
        const node = <button key="a" {...props} />;

        expect(node.key).toBe('b');
        expect(node.props).not.toHaveProperty('key');
    });

    for (const [name, runtime] of Object.entries({ jsx, jsxs, jsxDEV })) 
        it(`should resolve spread keys through ${name}`, () => {
            const node = runtime('button', { key: 0 }, 'argument');

            expect(node.key).toBe(0);
            expect(node.props).not.toHaveProperty('key');
        });
    

    it('should preserve the DOM node and focus after a spread-keyed state update', () => {
        const container = document.body.appendChild(document.createElement('main'));
        const renderButton = (active: boolean) =>
            renderer.render(
                <button {...{ key: 'stable', className: active ? 'active' : 'inactive' }}>
                    {active ? 'Updated' : 'Initial'}
                </button>,
                container
            );

        try {
            renderButton(false);

            const button = container.querySelector('button')!;

            button.focus();
            expect(document.activeElement).toBe(button);

            renderButton(true);

            expect(container.querySelector('button')).toBe(button);
            expect(button.className).toBe('active');
            expect(button.textContent).toBe('Updated');
            expect(document.activeElement).toBe(button);
        } finally {
            container.remove();
        }
    });

    it('should render JSX to DOM', () => {
        renderer.render(
            <a href="https://idea2.app/" style={{ fontSize: '2rem', '--color': 'red' }}>
                idea2app
            </a>
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="font-size: 2rem; --color: red;">idea2app</a>'
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
        const onClick = fn();

        renderer.render(<i onClick={onClick} />);

        document.querySelector('i')?.click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should toggle a real DOM Node by callbacks', () => {
        const ref = fn();

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
        const oldVDOM = <a>old</a>;

        renderer.render(
            <>
                <nav>{oldVDOM}</nav>
                <nav>{oldVDOM}</nav>
            </>
        );
        expect(document.body.innerHTML).toBe('<nav><a>old</a></nav><nav><a>old</a></nav>');

        const newVDOM = <a>new</a>;

        renderer.render(
            <>
                <nav>{newVDOM}</nav>
                <nav>{newVDOM}</nav>
            </>
        );
        expect(document.body.innerHTML).toBe('<nav><a>new</a></nav><nav><a>new</a></nav>');
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
        expect(renderer.renderToStaticMarkup(<i />)).toBe('<i />');
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
