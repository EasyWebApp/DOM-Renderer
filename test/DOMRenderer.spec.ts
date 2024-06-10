import { DOMRenderer, VNode } from '../source/dist';

describe('DOM Renderer', () => {
    const renderer = new DOMRenderer(),
        root = new VNode({ tagName: 'body', node: document.body });

    it('should update DOM properties', () => {
        const newVNode = renderer.patch(
            { ...root },
            {
                ...root,
                props: { className: 'container' }
            }
        );
        expect(document.body.className).toBe('container');

        renderer.patch(newVNode, root);

        expect(document.body.className).toBe('');
    });

    it('should update DOM styles', () => {
        const newVNode = renderer.patch(
            { ...root },
            {
                ...root,
                style: { margin: '0' }
            }
        );
        expect(document.body.style.margin).toBe('0px');

        renderer.patch(newVNode, root);

        expect(document.body.style.margin).toBe('');
    });

    it('should update DOM children', () => {
        const newNode = renderer.patch(
            { ...root },
            {
                ...root,
                children: [
                    new VNode({
                        tagName: 'a',
                        props: { href: 'https://idea2.app/' },
                        style: { color: 'red' },
                        children: [new VNode({ text: 'idea2app' })]
                    })
                ]
            }
        );
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: red;">idea2app</a>'
        );
        renderer.patch(newNode, root);

        expect(document.body.innerHTML).toBe('');
    });

    it('should update DOM children without keys', () => {
        var newNode = renderer.patch(
            { ...root },
            { ...root, children: [{ children: [new VNode({ tagName: 'i' })] }] }
        );
        expect(document.body.innerHTML).toBe('<i></i>');

        newNode = renderer.patch(newNode, {
            ...root,
            children: [{ children: [new VNode({ tagName: 'a' })] }]
        });
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
            { ...root },
            {
                ...root,
                children: [new VNode({ tagName: 'x-test' })]
            }
        );
        expect(document.body.innerHTML).toBe('<x-test></x-test>');

        renderer.patch(newNode, {
            ...root,
            children: [
                new VNode({ text: 'y' }),
                new VNode({ tagName: 'x-test' })
            ]
        });
        expect(document.body.innerHTML).toBe('y<x-test></x-test>');

        expect(connectHook).toHaveBeenCalledTimes(1);
    });

    it('should render a Virtual DOM node to a Shadow Root', () => {
        const shadowRoot = document
            .createElement('div')
            .attachShadow({ mode: 'open' });

        const shadowVDOM = renderer.patch(
            VNode.fromDOM(shadowRoot),
            new VNode({ children: [new VNode({ tagName: 'a' })] })
        );
        expect(VNode.isFragment(shadowVDOM)).toBe(true);

        expect(shadowRoot.innerHTML).toBe('<a></a>');
    });
});
