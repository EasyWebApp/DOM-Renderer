# DOM Renderer

A light-weight DOM Renderer supports [Web components][1] standard & [TypeScript][2] language.

[![NPM Dependency](https://img.shields.io/librariesio/github/EasyWebApp/DOM-Renderer.svg)][3]
[![CI & CD](https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml/badge.svg)][4]

[![NPM](https://nodei.co/npm/dom-renderer.png?downloads=true&downloadRank=true&stars=true)][5]

[![Open in GitPod](https://gitpod.io/button/open-in-gitpod.svg)][6]

## Feature

-   input: [Virtual DOM][7] object in [JSX][8] syntax
-   output: [DOM][9] object or [XML][10] string of [HTML][11], [SVG][12] & [MathML][13] languages
-   run as: **Sync**, [Async][14], [Generator][15] functions & [Readable streams][16]

## Usage

### JavaScript

#### Sync Rendering

```js
import { DOMRenderer, VNode } from 'dom-renderer';

const newVNode = new DOMRenderer().patch(
    new VNode({
        tagName: 'body',
        node: document.body
    }),
    new VNode({
        tagName: 'body',
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
console.log(newVNode);
```

#### Async Rendering (experimental)

```diff
import { DOMRenderer, VNode } from 'dom-renderer';

-const newVNode = new DOMRenderer().patch(
+const newVNode = new DOMRenderer().patchAsync(
    new VNode({
        tagName: 'body',
        node: document.body
    }),
    new VNode({
        tagName: 'body',
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
-console.log(newVNode);
+newVNode.then(console.log);
```

### TypeScript

[![Edit DOM Renderer example](https://codesandbox.io/static/img/play-codesandbox.svg)][17]

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

##### Sync Rendering

```tsx
import { DOMRenderer } from 'dom-renderer';

const newVNode = new DOMRenderer().render(
    <a href="https://idea2.app/" style={{ color: 'red' }}>
        idea2app
    </a>
);
console.log(newVNode);
```

##### Async Rendering (experimental)

```diff
import { DOMRenderer } from 'dom-renderer';

const newVNode = new DOMRenderer().render(
    <a href="https://idea2.app/" style={{ color: 'red' }}>
        idea2app
-    </a>
+    </a>,
+    document.body,
+    'async'
);
-console.log(newVNode);
+newVNode.then(console.log);
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

[![Edit MobX Web components](https://codesandbox.io/static/img/play-codesandbox.svg)][18]

## Original

### Inspiration

[![SnabbDOM](https://github.com/snabbdom.png)][19]

### Prototype

[![Edit DOM Renderer](https://codesandbox.io/static/img/play-codesandbox.svg)][20]

[1]: https://www.webcomponents.org/
[2]: https://www.typescriptlang.org/
[3]: https://libraries.io/npm/dom-renderer
[4]: https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml
[5]: https://nodei.co/npm/dom-renderer/
[6]: https://gitpod.io/?autostart=true#https://github.com/EasyWebApp/DOM-Renderer
[7]: https://en.wikipedia.org/wiki/Virtual_DOM
[8]: https://facebook.github.io/jsx/
[9]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model
[10]: https://developer.mozilla.org/en-US/docs/Web/XML
[11]: https://developer.mozilla.org/en-US/docs/Web/HTML
[12]: https://developer.mozilla.org/en-US/docs/Web/SVG
[13]: https://developer.mozilla.org/en-US/docs/Web/MathML
[14]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[15]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*
[16]: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
[17]: https://codesandbox.io/s/dom-renderer-example-pmcsvs?autoresize=1&expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.tsx&theme=dark
[18]: https://codesandbox.io/s/mobx-web-components-pvn9rf?autoresize=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2FWebComponent.ts&moduleview=1&theme=dark
[19]: https://github.com/snabbdom/snabbdom
[20]: https://codesandbox.io/s/dom-renderer-pglxkx?autoresize=1&expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.ts&theme=dark
