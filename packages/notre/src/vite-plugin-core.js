import { notreValidationPlugin } from './vite-plugin.js';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { build as nitroBuild, createDevServer } from 'nitropack';
import fs from 'fs';
import path from 'path';

/**
 * @typedef {Object} NotreOptions
 * @property {string} [appRoot='./src'] - Application root directory
 * @property {string} [publicDir='./public'] - Public assets directory
 * @property {'static'|'node-server'|'vercel'|'netlify'|'cloudflare'} [preset='static'] - Deployment preset
 */

/**
 * Notre framework Vite plugin
 * @param {NotreOptions} options
 * @returns {import('vite').Plugin[]}
 */
export function notre(options = {}) {
  const appRoot = options.appRoot || './src';
  const publicDir = options.publicDir || './public';
  const preset = options.preset || 'static';

  return [
    notreValidationPlugin({ type: 'client' }),
    tsconfigPaths(),
    tailwindcss(),

    {
      name: 'notre-core',

      // Virtual modules for entry points
      resolveId(id) {
        if (id === 'virtual:notre/entry-client') return '\0' + id;
        if (id === 'virtual:notre/entry-server') return '\0' + id;
      },

      load(id) {
        if (id === '\0virtual:notre/entry-client') {
          return generateEntryClient(appRoot);
        }
        if (id === '\0virtual:notre/entry-server') {
          return generateEntryServer(appRoot);
        }
      },

      // Inject virtual entry into index.html
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html.replace(
            '<!--notre-root-->',
            '<div id="root"><!--ssr-outlet--></div>'
          ).replace(
            '</body>',
            '<script type="module" src="virtual:notre/entry-client"></script></body>'
          );
        }
      },

      // SSR rendering in dev
      async configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const url = req.url;

              // Let Vite handle assets
              if (url.startsWith('/@') || url.includes('.')) {
                return next();
              }

              // Load entry-server via Vite's SSR
              const { render } = await server.ssrLoadModule('virtual:notre/entry-server');
              const { html: appHtml, props } = await render(url);

              // Read index.html template
              let template = fs.readFileSync('index.html', 'utf-8');
              template = await server.transformIndexHtml(url, template);

              const finalHtml = template
                .replace('<!--ssr-outlet-->', appHtml)
                .replace('</body>', `<script>window.__PROPS__=${JSON.stringify(props)}</script></body>`);

              res.setHeader('Content-Type', 'text/html');
              res.end(finalHtml);
            } catch (e) {
              server.ssrFixStacktrace(e);
              next(e);
            }
          });
        };
      },

      // Production build with Nitro
      async closeBundle() {
        if (preset === 'static') {
          await buildSSG(appRoot, publicDir);
        } else {
          await buildSSR(appRoot, publicDir, preset);
        }
      }
    },

    // HMR plugin
    {
      name: 'notre-hmr',
      handleHotUpdate({ file, server }) {
        if (file.includes('/pages/')) {
          // Send custom event to client
          server.ws.send({
            type: 'custom',
            event: 'notre:route-update',
            data: { path: fileToPath(file, appRoot) }
          });
        }
      }
    }
  ];
}

/**
 * Generate client entry code
 * @param {string} appRoot
 * @returns {string}
 */
function generateEntryClient(appRoot) {
  return `
import { hydrateRoot, createRoot } from 'react-dom/client';
import React from 'react';

const allRoutes = import.meta.glob('${appRoot}/pages/**/*.{jsx,tsx}');

// Your existing routing logic from entry-client.tsx
${fs.readFileSync(`${appRoot}/entry-client.tsx`, 'utf-8').split('\n').slice(5).join('\n')}

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.on('notre:route-update', ({ path }) => {
    if (window.location.pathname === path) {
      main(); // Re-render current route
    }
  });
}
`;
}

/**
 * Generate server entry code
 * @param {string} appRoot
 * @returns {string}
 */
function generateEntryServer(appRoot) {
  return `
import React from 'react';
import { renderToString } from 'react-dom/server';

const allRoutes = import.meta.glob('${appRoot}/pages/**/*.{jsx,tsx}', { eager: true });

// Your existing routing logic
${extractServerLogic(appRoot)}

export async function render(url) {
  const route = findRoute(url);
  if (!route) return { html: '<h1>404</h1>', props: {} };

  const { pageLoader, pageParams, layoutLoaders } = route;
  const pageMod = await pageLoader();
  let CurrentComponent = pageMod.default;

  // Wrap with layouts
  for (let i = layoutLoaders.length - 1; i >= 0; i--) {
    const layoutMod = await layoutLoaders[i]();
    const LayoutComponent = layoutMod.default;
    const WrapperComponent = CurrentComponent;
    CurrentComponent = (props) => React.createElement(
      LayoutComponent, props,
      React.createElement(WrapperComponent, props)
    );
  }

  // Get SSR props
  let props = {};
  if (pageMod.ssr && pageMod.getServerSideProps) {
    const result = await pageMod.getServerSideProps({ params: pageParams });
    props = result.props;
  }

  const html = renderToString(React.createElement(CurrentComponent, { ...props, params: pageParams }));
  return { html, props };
}
`;
}

/**
 * Build static site
 * @param {string} appRoot
 * @param {string} publicDir
 */
async function buildSSG(appRoot, publicDir) {
  const routes = await discoverRoutes(appRoot);

  await nitroBuild({
    rootDir: process.cwd(),
    preset: 'static',
    publicAssets: [{ dir: publicDir }],
    prerender: { routes }
  });
}

/**
 * Build SSR server
 * @param {string} appRoot
 * @param {string} publicDir
 * @param {string} preset
 */
async function buildSSR(appRoot, publicDir, preset) {
  await nitroBuild({
    rootDir: process.cwd(),
    preset,
    publicAssets: [{ dir: publicDir }]
  });
}

/**
 * Discover all routes
 * @param {string} appRoot
 * @returns {Promise<string[]>}
 */
async function discoverRoutes(appRoot) {
  const glob = await import('glob');
  const files = glob.sync(`${appRoot}/pages/**/*.{jsx,tsx}`);

  return files
    .filter(f => !f.includes('_layout'))
    .map(f => fileToPath(f, appRoot));
}

/**
 * Convert file path to route path
 * @param {string} file
 * @param {string} appRoot
 * @returns {string}
 */
function fileToPath(file, appRoot) {
  return file
    .replace(`${appRoot}/pages`, '')
    .replace(/\/index\.(jsx|tsx)$/, '')
    .replace(/\.(jsx|tsx)$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1') || '/';
}

function extractServerLogic(appRoot) {
  // Extract routing functions from existing entry-server
  const content = fs.readFileSync(`${appRoot}/entry-server.tsx`, 'utf-8');
  const start = content.indexOf('function toPath');
  const end = content.indexOf('export default eventHandler');
  return content.slice(start, end);
}