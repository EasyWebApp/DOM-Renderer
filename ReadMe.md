# DOM Renderer

A light-weight DOM Renderer supports [Web components][1] standard & [TypeScript][2] language.

[![CI & CD](https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml/badge.svg)][3]

[![Open in GitPod](https://img.shields.io/badge/GitPod-dev--now-blue?logo=gitpod)][4]

[![NPM](https://nodei.co/npm/dom-renderer.png?downloads=true&downloadRank=true&stars=true)][5]

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

## Original

### Inspiration

[![SnabbDOM](https://github.com/snabbdom.png)][6]

### Prototype

[![Edit DOM renderer](https://codesandbox.io/static/img/play-codesandbox.svg)][7]

[1]: https://www.webcomponents.org/
[2]: https://www.typescriptlang.org/
[3]: https://github.com/EasyWebApp/DOM-Renderer/actions/workflows/main.yml
[4]: https://gitpod.io/#https://github.com/EasyWebApp/DOM-Renderer
[5]: https://nodei.co/npm/dom-renderer/
[6]: https://github.com/snabbdom/snabbdom
[7]: https://codesandbox.io/s/dom-renderer-pglxkx?autoresize=1&expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.ts&theme=dark
