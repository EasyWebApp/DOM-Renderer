import { Props, GeneratorNode, AsyncGeneratorNode, VChild } from './creator';
import { isEmpty } from 'web-utility/source/data';
import { clearList } from './utility';

export class AsyncComponent {
    function: Function;
    props: Props;
    generator: GeneratorNode | AsyncGeneratorNode;

    lastNodes: VChild[] = [];
    realNodes: HTMLElement[] = [];

    constructor(func: Function, props: Props) {
        this.function = func;
        this.props = props;
        this.generator = func.call(this, props);
    }

    *[Symbol.iterator]() {
        while (true) yield this.props;
    }

    async *[Symbol.asyncIterator]() {
        while (true) yield this.props;
    }

    async render() {
        const { realNodes } = this;

        const { value } = await this.generator.next(
            realNodes[1] ? realNodes : realNodes[0]
        );
        if (!isEmpty(value)) this.lastNodes = value;

        return clearList(this.lastNodes);
    }
}
