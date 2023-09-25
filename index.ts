import pluginutils from '@rollup/pluginutils';
import * as colors from 'colors/safe';
import history from 'connect-history-api-fallback';
import * as ejs from 'ejs';
import type { Options as EjsOptions } from 'ejs';
import htmlMinifierTerser from 'html-minifier-terser';
import { loadEnv } from 'vite';
import type { HtmlTagDescriptor, PluginOption, ResolvedConfig, Connect } from 'vite';

const DEFAULT_TEMPLATE = 'index.html';
interface RewritesItem {
  from: RegExp;
  to: string;
}

interface Options {
  minify?: boolean;
  template?: string;
  route?: RegExp | string;
  output?: string;
  templateParameters?: Record<string, any>;
  tags?: HtmlTagDescriptor[];
  ejsOptions?: EjsOptions;
  pages?: PageOptions[];
}

interface PageOptions {
  route?: RegExp | string;
  template: string;
  output?: string;
  templateParameters?: Record<string, any>;
  tags?: HtmlTagDescriptor[];
}

type RuntimePageOptions = PageOptions & { route: RegExp };
type RuntimeOptions = Options & { route?: RegExp, pages?: RuntimePageOptions[] };

const HtmlPlugin = (options: RuntimeOptions): PluginOption => {
  const isMpa = options.pages?.length;
  let env: Record<string,string> = {};
  let viteConfig: ResolvedConfig;

  function getTemplateUrl(templatePath: string | undefined, baseUrl = '') {
    // if set base from vite config, add it
    return baseUrl + (templatePath ?? DEFAULT_TEMPLATE);
  }

  return {
    name: 'vite-plugin-template-html',
    enforce: 'pre',
    config(conf) {
      // if set input config outset, will do nothing
      if (conf.build?.rollupOptions?.input) return;
      let input: Record<string, string> | string = {};
      if (isMpa) {
        options.pages?.forEach(item => {
          const output = item.output ?? item.template.slice(item.template.lastIndexOf('/'));
          (input as Record<string, string>)[output] = item.template;
        });
      } else if (options.output) {
        input[options.output] = options.template ?? DEFAULT_TEMPLATE;
      } else {
        input = options.template ?? DEFAULT_TEMPLATE;
      }
      return { build: { rollupOptions: { input } } };
    },
    configResolved(conf) {
      env = loadEnv(conf.mode, conf.root, '');
      viteConfig = conf;
    },
    configureServer(server) {
      const rewrites: RewritesItem[] = [];

      if (isMpa) {
        options.pages?.forEach((item: RuntimePageOptions) => {
          rewrites.push({
            from: item.route,
            to: getTemplateUrl(item.template, viteConfig.base),
          });
        });
      } else {
        rewrites.push({
          from: options.route ?? /.*/,
          to: getTemplateUrl(options.template, viteConfig.base),
        });
      }
      server.middlewares.use(history({
        disableDotRule: void 0,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
        rewrites,
      }) as Connect.HandleFunction);
    },
    transformIndexHtml: {
      enforce: 'pre',
      async transform(html, ctx) {
        const url = ctx.originalUrl ?? '';
        const filename = ctx.filename;
        let parameters = options.templateParameters ?? {};
        let tags = options.tags ?? [];
        if (isMpa) {
          const pageItem = options.pages?.find((item: RuntimePageOptions) =>
            filename.includes(item.template) || item.route.test(url));
          parameters = {
            ...parameters,
            ...pageItem?.templateParameters,
          };
          tags = tags.concat(pageItem?.tags ?? []);
        }
        return {
          html: await ejs.render(html, { ...env, ...viteConfig.define, ...parameters }, options.ejsOptions),
          tags,
        };
      },
    },
  };
};

const MinifyHtmlPlugin = (): PluginOption => ({
  name: 'vite-minify-template-html',
  enforce: 'post',
  async generateBundle(_, outBundle) {
    const htmlFilter = pluginutils.createFilter(['**/*.html']);
    for (const bundle of Object.values(outBundle)) {
      if (bundle.type === 'asset' && htmlFilter(bundle.fileName) && typeof bundle.source === 'string') {
        bundle.source = await htmlMinifierTerser.minify(bundle.source, {
          collapseWhitespace: true,
          keepClosingSlash: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
        });
      }
    }
  },
});

function getMpaRoute({ route, template }: PageOptions) {
  if (route) {
    return typeof route === 'string' ? new RegExp(`^${route}`) : route;
  } else {
    // if not set route but set template path in mpa, use template path to route
    const fileRoute = template.slice(0, Math.max(0, template.lastIndexOf('/')));
    if (fileRoute) return new RegExp(`^${fileRoute}`);
  }
}

function viteTemplateHtml(options: Options) {
  // convert route
  if (options.route) {
    options.route = typeof options.route === 'string' ? new RegExp(`^${options.route}`) : options.route;
  }
  // convert mpa pages route
  options.pages = options.pages?.filter(item => {
    const route = getMpaRoute(item);
    if (!route) {
      // eslint-disable-next-line no-console
      console.warn(
        colors.yellow(`We are confused about the options ${colors.red(JSON.stringify(item))}, please set the correct route or template`),
      );
      return false;
    }
    item.route = route;
    return true;
  });

  const plugins = [HtmlPlugin(options as RuntimeOptions)];
  if (options.minify !== false) {
    plugins.push(MinifyHtmlPlugin());
  }
  return plugins;
}

export default viteTemplateHtml;
