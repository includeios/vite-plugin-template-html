# vite-plugin-template-html

`vite-plugin-template-html` 的设计思路受 [vite-plugin-html](https://github.com/vbenjs/vite-plugin-html) 启发，沿用了其 EJS 模板、HTML 压缩等功能，不一样的是 `vite-plugin-template-html` 可以自定义路由转发，用户可以随心所欲的配置路由与访问的html文件间的关系，且有更良好的多页应用的支持。

**中文** | [English](./README.md)

[![npm][npm-img]][npm-url] [![node][node-img]][node-url]

## 功能

- EJS 模版能力：EJS 的语法支持，可以给模板传递自定义参数；
- HTML 压缩能力：构建时会自动开启 HTML 的压缩功能；
- 路由转发：集成 [connect-history-api-fallback](https://github.com/bripkens/connect-history-api-fallback#readme) 的能力，支持指定请求地址返回特定 HTML 文件
- 多页应用支持

## 安装 (yarn or npm or pnpm)

**node version:** >=14.0.0

**vite version:** >=2.0.0

```bash
yarn add vite-plugin-template-html -D
// 或
npm i vite-plugin-template-html -D
// 或
pnpm i vite-plugin-template-html -D
```

## 使用

如果你需要给 `index.html` 中注入数据，如下：
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
    // html 文件的相对地址
    template: 'index.html',
    // 需要注入的数据。其中会自动添加当前的环境变量和在 vite.config.js 中设置的 bash 参数
    templateParameters:{
      BASIC_PATH: path.join(__dirname, './public/template.html'),
      INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
    }
  })
})
```

如果你需要做路由代理，比方说现在的页面访问路径是 `http://localhost:xxxx/index.html`，你希望可以通过 `http://localhost:xxxx/overview` 这样的路由来替代
```js
viteHtmlPlugin({
  template: 'index.html',
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
    INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
  },
  // 需要代理的路由。支持正则或者字符串匹配，后续 http://localhost:xxxx/overview/**/* 的路由都会返回 index.html
  route: `/overview`,
})
```

如果你没有设置`build.rollupOptions.input`，我们会自动根据 `template` 的值来补充 input，同时，你也可以设置参数 `output` 来自定义输出的文件名
```js
viteHtmlPlugin({
  template: 'index.html',
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
    INJECT_SCRIPT: `<script type="module" src="/src/main.js"></script>`,
  },
  route: `/overview`,
  // 输出的文件名将从 index 变成 overview
  output: 'overview'
})
// 上述配置会被自动转化为
{
  rollupOptions: {
    input: {overview: 'index.html'}
  }
}
```

多页应用的配置
```js
viteHtmlPlugin({
  //pages 下每一个 html 文件都会注入的数据
  templateParameters:{
    BASIC_PATH: path.join(__dirname, './public/template.html'),
  },
  pages: [
    {
      template: 'src/pages/a/index.html',
      route: `/overview/a`,
      output: 'some-name-a',
      // 只会写入 a/index.html 文件下的数据
      templateParameters: {
        INJECT_SCRIPT: `<script type="module" src="/src/pages/a/main.js"></script>`
      }
    },
    {
      template: 'src/pages/b/index.html',
      route: `/overview/b`,
      output: 'some-name-b',
       // 只会写入 b/index.html 文件下的数据
      templateParameters: {
        INJECT_SCRIPT: `<script type="module" src="/src/pages/b/main.js"></script>`
      }
    }
  ]
})
```

## 参数说明

`viteHtmlPlugin(options: Options)`
### Options

| 参数                | 类型                  | 默认值        | 说明                                                      |
| ------------------ | --------------------- | ------------ | -------------------------------------------------------- |
| minify             | `boolean`             | `true`       | 是否在构建时压缩 HTML                                       |
| template           | `string`              | `index.html` | 模板的相对路径                                              |
| route              | `string | RegExp`     | /.*/         | 需要代理的路由                                                   |
| output             | `string`              | -            | 自定义输出名                                           |
| templateParameters | `Record<string, any>` | -            | 注入 HTML 的数据                                            |
| tags               | `HtmlTagDescriptor[]` | -            | 注入 HTML 的标签列表，[详见 Vite 介绍](https://vitejs.dev/guide/api-plugin.html#transformindexhtml)                        |
| ejsOptions         | `EjsOptions`          | -            | EJS 配置项 [EjsOptions](https://github.com/mde/ejs#options) |
| pages              | `PageOptions[]`       | -            | 多页配置                                                    |

### PageOptions

| 参数                | 类型                  | 默认值                        | 说明                          |
| ------------------- | -------------------- | ---------------------------- | ---------------------------- |
| template           | `string`              | -                           | 模板的相对路径，pages下**必填**                |
| route              | `string | RegExp`     | `template.lastIndexOf('/')` | 需要代理的路由,默认取template的文件名   |
| output             | `string`              | -                           | 自定义输出名                 |
| templateParameters | `Record<string, any>` | -                           | 注入 HTML 的数据                  |
| tags               | `HtmlTagDescriptor[]` | -                           | 注入 HTML 的标签列表，[详见 Vite 介绍](https://vitejs.dev/guide/api-plugin.html#transformindexhtml) |

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite-plugin-html.svg
[npm-url]: https://npmjs.com/package/vite-plugin-html
[node-img]: https://img.shields.io/node/v/vite-plugin-html.svg
[node-url]: https://nodejs.org/en/about/releases/
