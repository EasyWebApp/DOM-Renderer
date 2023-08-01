import { DOMRenderer } from '../source';

describe('DOM Renderer', () => {
    const renderer = new DOMRenderer(),
        root = { tagName: 'body', node: document.body };

    it('should update DOM properties', () => {
        const newVNode = renderer.patch(root, {
            ...root,
            props: { className: 'container' }
        });
        expect(document.body.className).toBe('container');

        renderer.patch(newVNode, root);

        expect(document.body.className).toBe('');
    });

    it('should update DOM styles', () => {
        const newVNode = renderer.patch(root, {
            ...root,
            style: { margin: 0 }
        });
        expect(document.body.style.margin).toBe('0px');

        renderer.patch(newVNode, root);

        expect(document.body.style.margin).toBe('');
    });

    it('should update DOM children', () => {
        const newNode = renderer.patch(root, {
            ...root,
            children: [
                {
                    tagName: 'a',
                    props: { href: 'https://idea2.app/' },
                    style: { color: 'red' },
                    children: [{ text: 'idea2app' }]
                }
            ]
        });
        expect(document.body.innerHTML).toBe(
            '<a href="https://idea2.app/" style="color: red;">idea2app</a>'
        );
        console.log(newNode, root);

        renderer.patch(newNode, root);

        expect(document.body.innerHTML).toBe('');
    });
});