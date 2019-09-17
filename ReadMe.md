# DOM Renderer

**Template engine** based on **HTML 5**, **ECMAScript 6** & **MVVM**

[![NPM Dependency](https://david-dm.org/EasyWebApp/DOM-Renderer.svg)](https://david-dm.org/EasyWebApp/DOM-Renderer)
[![Build Status](https://travis-ci.com/EasyWebApp/DOM-Renderer.svg?branch=master)](https://travis-ci.com/EasyWebApp/DOM-Renderer)
[![](https://data.jsdelivr.com/v1/package/npm/dom-renderer/badge?style=rounded)](https://www.jsdelivr.com/package/npm/dom-renderer)

[![NPM](https://nodei.co/npm/dom-renderer.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/dom-renderer/)

## Data binding

[`source/index.json`](https://github.com/EasyWebApp/DOM-Renderer/blob/master/test/source/index.json)

```JSON
{
    "name":     "TechQuery",
    "profile":  {
        "URL":    "https://tech-query.me/",
        "title":  "Web/JavaScript full-stack engineer"
    },
    "job":      [
        { "title": "freeCodeCamp" },
        { "title": "MVP" },
        { "title": "KaiYuanShe" }
    ]
}
```

`source/index.html` [**Template syntax**](https://web-cell.dev/DOM-Renderer/manual/Template.html)

```HTML
<template>
    <h1 hidden="${! view.name}">
        Hello, ${view.name} !
    </h1>

    <ul data-view="profile" hidden="${! view.name}">
        <template>
            <li title="${scope.name}">
                ${view.URL}
            </li>
            <li>${view.title}</li>
        </template>
    </ul>

    <ol data-view="job" hidden="${! view.name}">
        <template>
            <li>${view.title}</li>
        </template>
    </ol>

    <input type="text" name="name" placeholder="Switch account">
</template>
```

`source/index.js`

```JavaScript
import View, { parseDOM } from 'dom-renderer';

import template from './index.html';
import data from './index.json';

const view = new View( View.getTemplate( parseDOM( template ) ) );

await view.render( data );

console.log(view + '');
```

**Console output** (formatted)

```HTML
<h1>Hello, TechQuery !</h1>

<ul data-view="profile">
    <template>
        <li title="${scope.name}">
            ${view.URL}
        </li>
        <li>${view.title}</li>
    </template>
    <li title="TechQuery">https://tech-query.me/</li>
    <li>Web/JavaScript full-stack engineer</li>
</ul>

<ol data-view="job">
    <template>
        <li>${view.title}</li>
    </template>
    <li>freeCodeCamp</li>
    <li>MVP</li>
    <li>KaiYuanShe</li>
</ol>

<input type="text" name="name" placeholder="Switch account">
```

## Installation

### Web browser

```HTML
<script src="https://cdn.jsdelivr.net/npm/@babel/polyfill/dist/polyfill.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dom-renderer"></script>
```

### Node.JS

```Shell
npm install dom-renderer @babel/polyfill jsdom
```

```JavaScript
import '@babel/polyfill';
import 'dom-renderer/dist/polyfill';
import View from 'dom-renderer';
```

## Compile & bundle

```Shell
npm install web-cell-cli @babel/preset-env -D
```

`package.json`

```JSON
{
    "directories": {
        "lib": "source/"
    },
    "scripts": {
        "build": "web-cell pack"
    },
    "babel": {
        "presets": [
            "@babel/preset-env"
        ]
    }
}
```

```Shell
npm run build
```

## Advanced usage

Follow [the example above](#data-binding)

### Updating

```JavaScript
data.profile = null;  // Remove a Sub view

data.job.unshift({    // Reuse all Sub views of the list,
    title:  'FYClub'  // then add a new Sub view at end
});

view.render( data );
```

### Getter

```JavaScript
console.log( view.name );     // 'TechQuery'

console.log( view.profile );  // View {}

console.log( view.job );      // ViewList [View {}, View {}, View {}]
```

### Setter

```JavaScript
import { nextTick } from 'dom-renderer';

document.body.append(... view.topNodes);

view.name = 'tech-query';

await nextTick();

console.log( document.querySelector('h1').textContent );  // 'Hello, tech-query !'
```

### Inserting

```javascript
await view.job.insert({ title: 'ThoughtWorks' });

console.log(view.job + '');
```

**Console output** (formatted)

```html
<ol data-view="job">
    <template>
        <li>${view.title}</li>
    </template>
    <li>FYClub</li>
    <li>freeCodeCamp</li>
    <li>MVP</li>
    <li>KaiYuanShe</li>
    <li>ThoughtWorks</li>
</ol>
```

### Re-parsing

```javascript
const textNode = document.createTextNode('${view.test}');

view.parse(textNode);

await view.render({ test: 'example' });

document.body.append(textNode);

console.log(textNode.nodeValue); // 'example'
```

## Developer manual

https://web-cell.dev/DOM-Renderer/manual/

## Typical cases

1.  [WebCell](https://web-cell.dev/)
