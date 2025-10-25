export const getEntryServer = (tailwind: boolean) => `
import { eventHandler } from "vinxi/http";
import React from "react";
import { renderToString } from "react-dom/server";
import { getManifest } from "vinxi/manifest";
${tailwind ? 'import "./app.css";' : ""}

const allRoutes = import.meta.glob("./pages/**/*.{ts,tsx}");
const isDev = process.env.NODE_ENV !== 'production';

function toPath(path: string) {
  return (
    path
      .replace("./pages", "")
      .replace(/(\/index)?\.(ts|tsx)$/, "")
      .replace("/_layout", "") || "/"
  );
}

const routes = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => !path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader])
) as Record<string, () => Promise<any>>;

const layouts = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader])
) as Record<string, () => Promise<any>>;

function findRoute(path: string) {
  let pageLoader = null;
  let pageParams: Record<string, string> = {};
  const layoutLoaders: Array<() => Promise<any>> = [];

  if (routes[path]) {
    pageLoader = routes[path];
  }

  if (!pageLoader) {
    for (const routePath in routes) {
      if (routePath.includes("[")) {
        const routeParts = routePath.split("/").filter((p) => p);
        const pathParts = path.split("/").filter((p) => p);

        if (routeParts.length === pathParts.length) {
          const params: Record<string, string> = {};
          let match = true;

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith("[") && routeParts[i].endsWith("]")) {
              const paramName = routeParts[i].slice(1, -1);
              params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }

          if (match) {
            pageLoader = routes[routePath];
            pageParams = params;
            break;
          }
        }
      }
    }
  }

  if (!pageLoader) return null;

  const pathParts = path.split("/").filter((p) => p);
  let currentPathSegments: string[] = [];
  let foundSpecificLayout = false;

  for (let i = 0; i < pathParts.length; i++) {
    currentPathSegments.push(pathParts[i]);
    const segmentPath = "/" + currentPathSegments.join("/");
    if (layouts[segmentPath]) {
      layoutLoaders.push(layouts[segmentPath]);
      foundSpecificLayout = true;
    }
  }

  if (!foundSpecificLayout && layouts["/"]) {
    layoutLoaders.unshift(layouts["/"]);
  }

  return { pageLoader, pageParams, layoutLoaders };
}

export default eventHandler(async (event) => {
  const reqUrl = event.node.req.url;
  const host = event.node.req.headers.host;

  if (!reqUrl || !host) {
    return new Response("Bad Request", { status: 400 });
  }

  const path = new URL(reqUrl, "http://" + host).pathname;
  const route = findRoute(path);

  if (route) {
    const { pageLoader, pageParams, layoutLoaders } = route;
    const pageMod = await pageLoader();
    let CurrentComponent = pageMod.default;

    for (let i = layoutLoaders.length - 1; i >= 0; i--) {
      const layoutMod = await layoutLoaders[i]();
      const LayoutComponent = layoutMod.default;
      const WrapperComponent = CurrentComponent;
      CurrentComponent = (componentProps: any) => (
        React.createElement(LayoutComponent, componentProps,
          React.createElement(WrapperComponent, componentProps)
        )
      );
    }

    const clientManifest = getManifest("client");
    const clientEntry = clientManifest.inputs[clientManifest.handler];
    const clientPath = clientEntry.output.path;

    let cssLinks = "";

    if (!isDev && tailwind) {
      try {
        const fs = await import('fs');
        const pathModule = await import('path');
        const manifestPath = pathModule.join(process.cwd(), '.vinxi/build/client/_build/.vite/manifest.json');
        const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        const cssFiles = new Set<string>();
        const visitedChunks = new Set<string>();

        const collectCSS = (chunkKey: string) => {
          if (visitedChunks.has(chunkKey)) return;
          visitedChunks.add(chunkKey);

          const chunk = rawManifest[chunkKey];
          if (!chunk) return;

          if (Array.isArray(chunk.css)) {
            chunk.css.forEach((cssPath: string) => cssFiles.add(cssPath));
          }

          if (Array.isArray(chunk.imports)) {
            chunk.imports.forEach((importFile: string) => {
              for (const key in rawManifest) {
                if (rawManifest[key].file === "assets/" + importFile || key === importFile) {
                  collectCSS(key);
                  break;
                }
              }
            });
          }
        };

        collectCSS("virtual:$vinxi/handler/client");

        cssLinks = Array.from(cssFiles)
          .map((cssPath) => '<link rel="stylesheet" href="/_build/' + cssPath + '">')
          .join("\\n            ");
      } catch (e) {
        console.error("Failed to read manifest:", e);
      }
    }

    let metadata = pageMod.metadata || {};
    if (typeof metadata === "function") {
      metadata = await metadata({ params: pageParams, event });
    }
    const metaTags = generateMetaTags(metadata);

    if (pageMod.csr) {
      return new Response(
        \`<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            \${metaTags}
            ${tailwind ? "${cssLinks}" : ""}
          </head>
          <body>
            <div id="root"></div>
            <script>window.__PROPS__ = {};</script>
            <script type="module" src="\${clientPath}"></script>
          </body>
        </html>\`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    let props = {};
    if (pageMod.ssr && pageMod.getServerSideProps) {
      const result = await pageMod.getServerSideProps({ event, params: pageParams });
      props = result.props;
    }

    const app = React.createElement(CurrentComponent, { ...props, params: pageParams });
    const html = renderToString(app);

    return new Response(
      \`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          \${metaTags}
          ${tailwind ? "${cssLinks}" : ""}
        </head>
        <body>
          <div id="root">\${html}</div>
          <script>window.__PROPS__ = \${JSON.stringify(props)};</script>
          <script type="module" src="\${clientPath}"></script>
        </body>
      </html>\`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response("Not Found", { status: 404 });
});

function generateMetaTags(metadata: any): string {
  const tags: string[] = [];

  if (metadata.title) {
    tags.push("<title>" + metadata.title + "</title>");
  } else {
    tags.push("<title>notre</title>");
  }

  if (metadata.description) {
    tags.push('<meta name="description" content="' + metadata.description + '">');
  }

  if (metadata.favicon) {
    tags.push('<link rel="icon" href="' + metadata.favicon + '">');
  }

  return tags.join("\\n            ");
}
`;
