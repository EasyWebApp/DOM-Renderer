import { updateProps, insertChild, updateChild } from '../source/updater';

const { body } = document;

describe('DOM updater', () => {
    it('should update properties of a DOM Element', () => {
        body.innerHTML = '<i class="test" style="color: red" title="Test"></i>';

        const tag = body.firstElementChild as HTMLElement,
            onClick = () => {};

        updateProps(tag, {
            className: 'sample',
            style: { width: '100%' },
            'data-index': '0',
            hidden: true,
            onClick
        });

        expect(tag.outerHTML).toBe(
            '<i style="width: 100%;" data-index="0" class="sample" hidden=""></i>'
        );
        expect(tag.onclick).toBe(onClick);
    });

    it('should insert a Node to DOM tree based on Index', () => {
        const { childNodes } = body;

        insertChild(body, 'test');

        expect(childNodes[1].nodeValue).toBe('test');

        insertChild(body, document.createElement('a'), 1);

        expect(childNodes[1].nodeName).toBe('A');
    });

    it('should update a Child Node based on Virtual Node', () => {
        const link = body.childNodes[1];

        updateChild(body, { tagName: 'a', href: '#', childNodes: [] }, 0);

        expect(body.childNodes[0]).toBe(link);
        expect(body.innerHTML).toBe(
            '<a href="#"></a><i style="width: 100%;" data-index="0" class="sample" hidden=""></i>test'
        );
    });
});
