# Template syntax

Source code of **DOM-Renderer** templates is legal [HTML 5 markups][1] with legal [ECMAScript 6 template literals][2] in it.

## Typical example

```HTML
<template>
    <h1 hidden="${! view.name}">
        Hello, ${view.name} !
    </h1>

    <ul data-view="profile">
        <template>
            <li title="${scope.name}">
                ${view.URL}
            </li>
            <li>${view.title}</li>
        </template>
    </ul>

    <ol data-view="job">
        <template>
            <li>${view.title}</li>
        </template>
    </ol>

    <input type="text" name="name" placeholder="Switch account">
</template>
```

|            Code            |       Type       |                                      Explanation                                      |
| :------------------------: | :--------------: | :-----------------------------------------------------------------------------------: |
|           `this`           |  Local variable  |              The [Element][3] which current Template literals located at              |
|           `view`           |  Local variable  |      **Data object** of the [View][4] which current Template literals located at      |
|          `scope`           |  Local variable  |       Data object of the parent View which current Template literals located at       |
|     `"${! view.name}"`     | Template literal |         Evaluated value of Template literals supports all kinds of Data types         |
| `hidden="${! view.name}"`  |  HTML attribute  |                 HTML Boolean attributes are treated as DOM Properties                 |
|     `data-view="job"`      |  HTML attribute  | Attribute value is a key in current View data, Object or Array will map to Sub views  |
| `<template>...</template>` |     HTML tag     | A `<template />` may map to a View or Sub views, `<!-- -->` is a Compatibility option |
|   `<input name="name">`    |     HTML tag     |        The same-name value of Data object will be updated by User's inputting         |

[1]: https://developer.mozilla.org/en-US/docs/Web/HTML
[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
[3]: https://developer.mozilla.org/en-US/docs/Web/API/element
[4]: https://web-cell.tk/DOM-Renderer/class/source/view/View.js~View.html
