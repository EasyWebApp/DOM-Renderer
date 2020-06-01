import {
    Props,
    render,
    createElement,
    Fragment,
    GeneratorNode
} from '../source';

const { body } = document;

describe('Render methods', () => {
    const log = jest.fn();

    it('should render HTML nodes', async () => {
        await render(
            <Fragment>
                0<a>1</a>
            </Fragment>
        );

        expect(body.innerHTML).toBe('0<a>1</a>');
    });

    function Sync({ children }: Props) {
        return <b>{children}</b>;
    }

    it('should render a Sync Function Component', async () => {
        await render(<Sync>2</Sync>);

        expect(body.innerHTML).toBe('<b>2</b>');
    });

    async function Async({ children }: Props) {
        await new Promise(resolve => setTimeout(resolve));

        return <i>{children}</i>;
    }

    it('should render an Async Function Component', async () => {
        await render(<Async>3</Async>);

        expect(body.innerHTML).toBe('<i>3</i>');
    });

    function* Generator({ children }: Props): GeneratorNode {
        for (const { children } of this) {
            const element = (yield <p>{children}</p>) as Element;

            log(element.outerHTML);
        }
    }

    it('should render a Generator Function Component', async () => {
        await render(<Generator>4</Generator>);

        expect(body.innerHTML).toBe('<p>4</p>');
    });

    async function* AsyncGenerator({ children }: Props) {
        for await (const { children } of this) {
            const element = (yield <q>{children}</q>) as Element;

            log(element.outerHTML);
        }
    }

    it('should render an Async Generator Function Component', async () => {
        await render(<AsyncGenerator>5</AsyncGenerator>);

        expect(body.innerHTML).toBe('<q>5</q>');
    });

    it('should render kinds of Function Components in a Tree', async () => {
        await render(
            <Fragment>
                0<a>1</a>
                <Sync>2</Sync>
                <Async>3</Async>
                <Generator>4</Generator>
                <AsyncGenerator>5</AsyncGenerator>
                <div>
                    <Generator>
                        6<AsyncGenerator>7</AsyncGenerator>
                    </Generator>
                </div>
            </Fragment>
        );

        expect(body.innerHTML).toBe(
            `0<a>1</a><b>2</b><i>3</i><p>4</p><q>5</q><div><p>6<q>7</q></p></div>`
        );
        expect(log).toBeCalledTimes(1);
        expect(log).lastCalledWith('<q>5</q>');
    });

    it('should update kinds of Function Components in a Tree', async () => {
        await render(
            <Fragment>
                0<a>1</a>
                <Sync>2</Sync>
                <Async>3-1</Async>
                <Generator>4-1</Generator>
                <AsyncGenerator>5-1</AsyncGenerator>
                <div>
                    <Generator>
                        6-1
                        <AsyncGenerator>7-1</AsyncGenerator>
                    </Generator>
                </div>
            </Fragment>
        );

        expect(body.innerHTML).toBe(
            `0<a>1</a><b>2</b><i>3-1</i><p>4-1</p><q>5-1</q><div><p>6-1<q>7-1</q></p></div>`
        );
        expect(log).toBeCalledTimes(5);
        expect(log).lastCalledWith('<q>7</q>');
    });
});
