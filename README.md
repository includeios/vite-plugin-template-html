# vite-plugin-template-html

Inspired by [`vite-plugin-html`](https://github.com/vbenjs/vite-plugin-html), we designed a new vite plugin for inject data into html and request proxy. Features such as EJS template, HTML compression are extended. But `vite-plugin-template-html` is more powerful in that it can proxy url requests through a specified HTML file whimsicality, and it is better support for multi-page applications.

**English** | [中文](./README.zh_CN.md)

[![npm][npm-img]][npm-url]

## Features

- EJS template: EJS syntax support, you can pass custom parameters to HTML file;
- HTML compression: Automatically turned on when building;
- Requests proxy: Support url requests through a specified HTML file;
- Multi-page application support;

## Install (yarn or npm or pnpm)

**node version:** >=14.0.0

**vite version:** >=2.0.0

```bash
yarn add vite-plugin-template-html -D
// or
npm i vite-plugin-template-html -D
// or
pnpm i vite-plugin-template-html -D
```

## Usage

If you need to inject data into `index.html`, follow as:
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh-cn">
  <head>
    <%- include(BASIC_PATH) -%>
  </head>
  <body>
    <div id="app"></div>
    <%- INJECT_SCRIPT -%>
  </body>
</html>
```
```js
// vite.config.js
import { defineConfig } from 'vite';
import viteHtmlPlugin from 'vite-plugin-template-html';

export default defineConfig({
  viteHtmlPlugin({
    // relative path to the html file
    template: 'index.html',
    // data that needs to injected into the index.html, it will automatically add the current envirnoment variables and bash parameters seted
    templateParameters:{
      BASIC_PATH: path.join(__dirname, './public/template.html'),
      INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
    }
  })
})
```

If you need server proxy, such as change url `http://localhost:xxxx/index.html` to `http://localhost:xxxx/overview`, you should set config like this:
```js
viteHtmlPlugin({
  template: 'index.html',
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
    INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
  },
  // rewrite request from route. http://localhost:xxxx/overview/**/* url requests will both return index.html
  route: `/overview`,
})
```

It will automatically set `build.rollupOptions.input` base on `template` parameter value if you do not set input value. and you can also set `output` parameter value to set custom output filename.
```js
viteHtmlPlugin({
  template: 'index.html',
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
    INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
  },
  route: `/overview`,
  // file will be rename index to overview
  output: 'overview'
})
// converted to:
{
  rollupOptions: {
    input: {overview: 'index.html'}
  }
}
```

Multi-page application configuration:
```js
viteHtmlPlugin({
  // data will be injected for each html file
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
  },
  pages: [
    {
      template: 'src/pages/a/index.html',
      route: `/overview/a`,
      output: 'some-name-a',
      // data will be only injected for a/index.html
      templateParameters: {
        INJECT_SCRIPT: `<script type="module" src="/src/pages/a/main.js"></script>`
      }
    },
    {
      template: 'src/pages/b/index.html',
      route: `/overview/b`,
      output: 'some-name-b',
      // data will be only injected for b/index.html
      templateParameters: {
        INJECT_SCRIPT: `<script type="module" src="/src/pages/b/main.js"></script>`
      }
    }
  ]
})
```

## Parameter Description

`viteHtmlPlugin(options: Options)`
### Options

| Parameter          | Types                 | Default      | Description                                              |
| ------------------ | --------------------- | ------------ | -------------------------------------------------------- |
| minify             | `boolean`             | `true`       | whether to compress HTML when building                   |
| template           | `string`              | `index.html` | relative path to the HTML file                           |
| route              | `string or RegExp`     | /.*/         | request proxy from route                                 |
| output             | `string`              | -            | custom output filename when building                     |
| templateParameters | `Record<string, any>` | -            | data injected into HTML                                  |
| tags               | `HtmlTagDescriptor[]` | -            | list of tags to inject, [Detail from Vite](https://vitejs.dev/guide/api-plugin.html#transformindexhtml)|
| ejsOptions         | `EjsOptions`          | -            | EJS configuration options [EjsOptions](https://github.com/mde/ejs#options) |
| pages              | `PageOptions[]`       | -            | multi-page configuration                                  |

### PageOptions

| Parameter          | Types                 | Default                     | Description                                                     |
| ------------------ | --------------------- | --------------------------- | --------------------------------------------------------------- |
| template           | `string`              | -                           | relative path to the HTML file, is **request** in PageOptions   |
| route              | `string or RegExp`     | `template.lastIndexOf('/')` | request proxy from route, default is template file name         |
| output             | `string`              | -                           | custom output filename when building                            |
| templateParameters | `Record<string, any>` | -                           | data injected into HTML                                         |
| tags               | `HtmlTagDescriptor[]` | -                           | list of tags to inject, [Detail from Vite](https://vitejs.dev/guide/api-plugin.html#transformindexhtml) |

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite-plugin-template-html.svg
[npm-url]: https://npmjs.com/package/vite-plugin-template-html
