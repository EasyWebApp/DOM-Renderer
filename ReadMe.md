# DOM Renderer

A light-weight DOM Renderer supports [Web components][1] standard & [TypeScript][2] language.

[![NPM Dependency](https://img.shields.io/librariesio/github/EasyWebApp/DOM-Renderer.svg)][3]
[![CI & CD](https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml/badge.svg)][4]

[![NPM](https://nodei.co/npm/dom-renderer.png?downloads=true&downloadRank=true&stars=true)][5]

[![Open in GitPod](https://gitpod.io/button/open-in-gitpod.svg)][6]

## Usage

### JavaScript

```js
import { DOMRenderer } from 'dom-renderer';

const newVNode = new DOMRenderer().patch(
    {
        tagName: 'body',
        node: document.body
    },
    {
        tagName: 'body',
        children: [
            {
                tagName: 'a',
                props: { href: 'https://idea2.app/' },
                style: { color: 'red' },
                children: [{ text: 'idea2app' }]
            }
        ]
    }
);

console.log(newVNode);
```

### TypeScript

[![Edit DOM Renderer example](https://codesandbox.io/static/img/play-codesandbox.svg)][7]

#### `tsconfig.json`

```json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "dom-renderer"
    }
}
```

#### `index.tsx`

```tsx
import { DOMRenderer } from 'dom-renderer';

const newVNode = new DOMRenderer().render(
    <a href="https://idea2.app/" style={{ color: 'red' }}>
        idea2app
    </a>
);

console.log(newVNode);
```

### Node.js & Bun

#### `view.tsx`

```tsx
import { DOMRenderer } from 'dom-renderer';

const renderer = new DOMRenderer();

const Hello = () => <h1>Hello, JSX SSR!</h1>;

export const generateStream = () => renderer.renderToReadableStream(<Hello />);
```

#### `index.ts`

```js
import { Readable } from 'stream';
import { createServer } from 'http';
import 'dom-renderer/polyfill';

import { generateStream } from './view';

createServer((request, response) => {
    const stream = generateStream();

    Readable.fromWeb(stream).pipe(response);
}).listen(8080);
```

## Framework

### Web components

[![Edit MobX Web components](https://codesandbox.io/static/img/play-codesandbox.svg)][8]

## Original

### Inspiration

[![SnabbDOM](https://github.com/snabbdom.png)][9]

### Prototype

[![Edit DOM Renderer](https://codesandbox.io/static/img/play-codesandbox.svg)][10]

[1]: https://www.webcomponents.org/
[2]: https://www.typescriptlang.org/
[3]: https://libraries.io/npm/dom-renderer
[4]: https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml
[5]: https://nodei.co/npm/dom-renderer/
[6]: https://gitpod.io/?autostart=true#https://github.com/EasyWebApp/DOM-Renderer
[7]: https://codesandbox.io/s/dom-renderer-example-pmcsvs?autoresize=1&expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.tsx&theme=dark
[8]: https://codesandbox.io/s/mobx-web-components-pvn9rf?autoresize=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2FWebComponent.ts&moduleview=1&theme=dark
[9]: https://github.com/snabbdom/snabbdom
[10]: https://codesandbox.io/s/dom-renderer-pglxkx?autoresize=1&expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.ts&theme=dark
