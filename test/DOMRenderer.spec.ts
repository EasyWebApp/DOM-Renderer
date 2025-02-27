import { DOMRenderer, VNode } from '../source/dist';

globalThis.CDATASection = class extends Text {};

describe('DOM Renderer', () => {
    const renderer = new DOMRenderer(),
        root = new VNode({ tagName: 'body', node: document.body });

    it('should update DOM properties', () => {
        const newVNode = renderer.patch(
            new VNode({ ...root }),
            new VNode({
                ...root,
                props: { className: 'container' }
            })
        );
        expect(document.body.className).toBe('container');

        renderer.patch(newVNode, root);

        expect(document.body.className).toBe('');
    });

    it('should update DOM styles', () => {
        const newVNode = renderer.patch(
            new VNode({ ...root }),
            new VNode({
                ...root,
                style: { margin: '0', '--color': 'red' }
            })
        );
        expect(document.body.style.margin).toBe('0px');
        expect(document.body.style.getPropertyValue('--color')).toBe('red');

        renderer.patch(newVNode, root);

        expect(document.body.style.margin).toBe('');
        expect(document.body.style.getPropertyValue('--color')).toBe('');
    });

    it('should update DOM children', () => {
        const newNode = renderer.patch(
            new VNode({ ...root }),
            new VNode({
                ...root,
                children: [
                    new VNode({
                        tagName: 'a',
                        props: { href: 'https://idea2.app/' },
                        style: { color: 'red' },
                        children: [new VNode({ text: 'idea2app' })]
                    })
                ]
            })
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: red;">idea2app</a>'
        );
        renderer.patch(newNode, root);

        expect(document.body.innerHTML).toBe('');
    });

    it('should update DOM children without keys', () => {
        var newNode = renderer.patch(
            new VNode({ ...root }),
            new VNode({
                ...root,
                children: [new VNode({ children: [new VNode({ tagName: 'i' })] })]
            })
        );
        expect(document.body.innerHTML).toBe('<i></i>');

        newNode = renderer.patch(
            newNode,
            new VNode({
                ...root,
                children: [new VNode({ children: [new VNode({ tagName: 'a' })] })]
            })
        );
        expect(document.body.innerHTML).toBe('<a></a>');

        renderer.patch(newNode, root);
    });

    it('should not invoke duplicated Connected Callbacks during updating', () => {
        const connectHook = jest.fn();

        class Test extends HTMLElement {
            connectedCallback() {
                connectHook();
            }
        }
        customElements.define('x-test', Test);

        const newNode = renderer.patch(
            new VNode({ ...root }),
            new VNode({
                ...root,
                children: [new VNode({ tagName: 'x-test' })]
            })
        );
        expect(document.body.innerHTML).toBe('<x-test></x-test>');

        renderer.patch(
            newNode,
            new VNode({
                ...root,
                children: [new VNode({ text: 'y' }), new VNode({ tagName: 'x-test' })]
            })
        );
        expect(document.body.innerHTML).toBe('y<x-test></x-test>');

        expect(connectHook).toHaveBeenCalledTimes(1);
    });

    it('should render a Virtual DOM node to a Shadow Root', () => {
        const shadowRoot = document.createElement('div').attachShadow({ mode: 'open' });

        const shadowVDOM = renderer.patch(
            VNode.fromDOM(shadowRoot),
            new VNode({ children: [new VNode({ tagName: 'a' })] })
        );
        expect(VNode.isFragment(shadowVDOM)).toBe(true);

        expect(shadowRoot.innerHTML).toBe('<a></a>');
    });

    it('should render a Virtual DOM node in Async mode', async () => {
        const promise = renderer.render(new VNode({ tagName: 'a' }), document.body, 'async');

        expect(document.body.innerHTML).not.toBe('<a></a>');

        await promise;

        expect(document.body.innerHTML).toBe('<a></a>');
    });

    it('should stop unfinished Async Rendering while new Async Rendering is started', async () => {
        const oldTree = await renderer.render(new VNode({ tagName: 'a' }), document.body, 'async');

        expect(document.body.outerHTML).toBe('<body><a></a></body>');

        const promise1 = renderer.patchAsync(
            oldTree,
            new VNode({
                ...root,
                props: { className: 'dark' },
                children: [new VNode({ tagName: 'a', props: { href: '/about' } })]
            })
        );
        expect(document.body.outerHTML).toBe('<body class="dark"><a></a></body>');

        const promise2 = renderer.patchAsync(
            oldTree,
            new VNode({
                ...root,
                props: { className: 'light' },
                children: [new VNode({ tagName: 'b' })]
            })
        );
        expect(promise1).rejects.toThrow('aborted');

        await promise2;

        expect(document.body.outerHTML).toBe('<body class="light"><b></b></body>');
    });

    class ShadowRootTag extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'closed' }).innerHTML = '<a></a>';
        }
    }
    customElements.define('shadow-root-tag', ShadowRootTag);

    it('should render the Shadow Root to HTML strings', () => {
        const markup = renderer.renderToStaticMarkup(new VNode({ tagName: 'shadow-root-tag' }));

        expect(markup).toBe(
            `<shadow-root-tag><template shadowrootmode="closed"><a></a></template></shadow-root-tag>`
        );
    });

    it('should render the Shadow Root to a Readable Stream', async () => {
        const stream = renderer.renderToReadableStream(new VNode({ tagName: 'shadow-root-tag' })),
            markups: string[] = [];

        for await (const markup of stream) markups.push(markup);

        expect(markups.join('')).toBe(
            `<shadow-root-tag><template shadowrootmode="closed"><a></a></template></shadow-root-tag>`
        );
    });
});
