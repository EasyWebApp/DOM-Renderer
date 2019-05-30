# Render existed DOM trees

`index.html`

```html
<body>
    <ol>
        <template>
            <li>${view.name}</li>
            <li>${view.URL}</li>
        </template>
    </ol>
    <ul>
        <template>
            <li>${view.name}</li>
        </template>
    </ul>

    <script>
        const { ViewList } = self['dom-renderer'],
            views = document.body.children;

        const single = new ViewList(views[0]),
            multiple = new ViewList(views[1]);

        await single.render([
            {
                name: 'TechQuery',
                URL: 'https://tech-query.me/'
            }
        ]);

        await multiple.render([
            { name: 'freeCodeCamp' },
            { name: 'KaiYuanShe' }
        ]);
    </script>
</body>
```
