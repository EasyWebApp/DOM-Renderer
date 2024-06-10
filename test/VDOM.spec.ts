import { VNode } from '../source/dist';

describe('VDOM', () => {
    it('should transfer a DOM node to a Virtual DOM node', () => {
        const vNode = VNode.fromDOM(document.body);
        const { tagName, selector, node } = vNode;

        expect(vNode).toBeInstanceOf(VNode);

        expect({ tagName, selector, node }).toEqual({
            tagName: 'body',
            selector: 'body',
            node: document.body
        });
    });

    it('should detect a Fragment VNode', () => {
        const result = VNode.isFragment({
            key: undefined,
            tagName: undefined,
            props: {},
            children: []
        });
        expect(result).toBe(true);
    });

    it('should only generate a selector for a Virtual DOM element', () => {
        const vElement = new VNode({
            tagName: 'i',
            is: 'my-icon',
            props: { className: 'icon love' }
        });
        expect(vElement.selector).toBe('i.icon.love[is="my-icon"]');

        const vFragment = new VNode({ children: [] }),
            vText = new VNode({ text: 'Hello, Web components!' });

        expect(vFragment.selector).toBeUndefined();
        expect(vText.selector).toBeUndefined();
    });

    it('should merge Fragment VDOM nodes', () => {
        const oneLevelFragment = new VNode({
                children: [new VNode({ tagName: 'b' })]
            }),
            twoLevelFragment = new VNode({
                children: [oneLevelFragment, oneLevelFragment]
            });
        const fragmentVNode = new VNode({
            children: [
                new VNode({ tagName: 'a' }),
                oneLevelFragment,
                twoLevelFragment
            ]
        });
        expect(fragmentVNode).toEqual({
            children: [
                { tagName: 'a', selector: 'a' },
                { tagName: 'b', selector: 'b' },
                { tagName: 'b', selector: 'b' },
                { tagName: 'b', selector: 'b' }
            ]
        });
    });
});
