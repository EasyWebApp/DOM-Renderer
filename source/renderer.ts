import {
    RenderNode,
    GeneratorNode,
    VChildNode,
    VElement,
    VChildren
} from './creator';
import { AsyncComponent } from './AsyncComponent';
import { clearList } from './utility';
import { updateTree } from './updater';

export function isAsync(node: RenderNode) {
    return (
        node instanceof Promise ||
        (node as GeneratorNode).next instanceof Function
    );
}

export function* updateComponentTree(
    next: VChildNode[],
    prev: VChildNode[] = []
) {
    for (const node of next)
        if (node instanceof AsyncComponent) {
            const index = prev.findIndex(
                item =>
                    item instanceof AsyncComponent &&
                    item.function === node.function
            );

            if (index < 0) yield node;
            else {
                const current = prev.splice(index, 1)[0] as AsyncComponent;

                const { children, ...rest } = node.props;

                Object.assign(current.props, rest);

                current.props.children = [
                    ...updateComponentTree(
                        children as VChildNode[],
                        current.props.children as VChildNode[]
                    )
                ];
                yield current;
            }
        } else if (typeof node === 'object') {
            const index = prev.findIndex(
                (item: VElement) => item.tagName === node.tagName
            );

            if (index < 0) yield node;
            else {
                const current = prev.splice(index, 1)[0] as VElement;

                const { childNodes, ...rest } = node;

                Object.assign(current, rest);

                current.childNodes = [
                    ...updateComponentTree(childNodes, current.childNodes)
                ];
                yield current;
            }
        } else yield node;
}

const vTreeMap = new WeakMap<HTMLElement, VChildNode[]>();

export function render(children: VChildren, root = document.body) {
    children = [
        ...updateComponentTree(
            clearList(children as VChildNode[]),
            vTreeMap.get(root)
        )
    ];
    vTreeMap.set(root, children);

    return updateTree(children, root);
}
