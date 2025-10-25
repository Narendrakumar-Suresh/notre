import { jsx as _jsx } from "react/jsx-runtime";
import { eventHandler } from "vinxi/http";
import React from "react";
import { renderToString } from "react-dom/server";
import { getManifest } from "vinxi/manifest";
import "./app.css";
const allRoutes = import.meta.glob("./pages/**/*.{ts,tsx}");
function toPath(path) {
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
    .map(([path, loader]) => [toPath(path), loader]),
);
const layouts = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader]),
);
function findRoute(path) {
  let pageLoader = null;
  let pageParams = {};
  const layoutLoaders = [];
  if (routes[path]) {
    pageLoader = routes[path];
  }
  if (!pageLoader) {
    for (const routePath in routes) {
      if (routePath.includes("[")) {
        const routeParts = routePath.split("/").filter((p) => p);
        const pathParts = path.split("/").filter((p) => p);
        if (routeParts.length === pathParts.length) {
          const params = {};
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
  if (!pageLoader) {
    return null;
  }
  const pathParts = path.split("/").filter((p) => p);
  let currentPathSegments = [];
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
const isDev = process.env.NODE_ENV !== "production";
export default eventHandler(async (event) => {
  const reqUrl = event.node.req.url;
  const host = event.node.req.headers.host;
  if (!reqUrl || !host) {
    return new Response("Bad Request", { status: 400 });
  }
  const path = new URL(reqUrl, `http://${host}`).pathname;
  const route = findRoute(path);
  if (route) {
    const { pageLoader, pageParams, layoutLoaders } = route;
    const pageMod = await pageLoader();
    let CurrentComponent = pageMod.default;
    for (let i = layoutLoaders.length - 1; i >= 0; i--) {
      const layoutLoader = layoutLoaders[i];
      const layoutMod = await layoutLoader();
      const LayoutComponent = layoutMod.default;
      const WrapperComponent = CurrentComponent;
      CurrentComponent = (componentProps) =>
        _jsx(LayoutComponent, {
          ...componentProps,
          children: _jsx(WrapperComponent, { ...componentProps }),
        });
    }
    const clientManifest = getManifest("client");
    const clientEntry = clientManifest.inputs[clientManifest.handler];
    const clientPath = clientEntry.output.path;
    let cssLinks = "";
    // In production, read the raw manifest to get CSS files
    if (!isDev) {
      try {
        const fs = await import("fs");
        const pathModule = await import("path");
        const manifestPath = pathModule.join(
          process.cwd(),
          ".vinxi/build/client/_build/.vite/manifest.json",
        );
        const rawManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const cssFiles = new Set();
        const visitedChunks = new Set();
        const collectCSS = (chunkKey) => {
          if (visitedChunks.has(chunkKey)) return;
          visitedChunks.add(chunkKey);
          const chunk = rawManifest[chunkKey];
          if (!chunk) return;
          if (Array.isArray(chunk.css)) {
            chunk.css.forEach((cssPath) => cssFiles.add(cssPath));
          }
          if (Array.isArray(chunk.imports)) {
            chunk.imports.forEach((importFile) => {
              for (const key in rawManifest) {
                if (
                  rawManifest[key].file === `assets/${importFile}` ||
                  key === importFile
                ) {
                  collectCSS(key);
                  break;
                }
              }
            });
          }
        };
        collectCSS("virtual:$vinxi/handler/client");
        cssLinks = Array.from(cssFiles)
          .map((cssPath) => `<link rel="stylesheet" href="/_build/${cssPath}">`)
          .join("\n            ");
      } catch (e) {
        console.error("Failed to read manifest:", e);
      }
    }
    // In dev mode, CSS is handled by Vite's HMR, no need to add link tags
    let metadata = pageMod.metadata || {};
    if (typeof metadata === "function") {
      metadata = await metadata({ params: pageParams, event });
    }
    const metaTags = generateMetaTags(metadata);
    if (pageMod.csr) {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${metaTags}
            ${cssLinks}
          </head>
          <body>
            <div id="root"></div>
            <script>window.__PROPS__ = {};</script>
            <script type="module" src="${clientPath}"></script>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      );
    }
    let props = {};
    if (pageMod.ssr && pageMod.getServerSideProps) {
      const result = await pageMod.getServerSideProps({
        event,
        params: pageParams,
      });
      props = result.props;
    }
    const app = React.createElement(CurrentComponent, {
      ...props,
      params: pageParams,
    });
    const html = renderToString(app);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${metaTags}
          ${cssLinks}
        </head>
        <body>
          <div id="root">${html}</div>
          <script>window.__PROPS__ = ${JSON.stringify(props)};</script>
          <script type="module" src="${clientPath}"></script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }
  return new Response("Not Found", { status: 404 });
});
function generateMetaTags(metadata) {
  const tags = [];
  if (metadata.title) {
    tags.push(`<title>${metadata.title}</title>`);
  } else {
    tags.push(`<title>notre</title>`);
  }
  if (metadata.description) {
    tags.push(`<meta name="description" content="${metadata.description}">`);
  }
  if (metadata.keywords) {
    tags.push(`<meta name="keywords" content="${metadata.keywords}">`);
  }
  if (metadata.author) {
    tags.push(`<meta name="author" content="${metadata.author}">`);
  }
  if (metadata.robots) {
    tags.push(`<meta name="robots" content="${metadata.robots}">`);
  }
  if (metadata.canonical) {
    tags.push(`<link rel="canonical" href="${metadata.canonical}">`);
  }
  if (metadata.favicon) {
    tags.push(`<link rel="icon" href="${metadata.favicon}">`);
  } else {
    tags.push(`<link rel="icon" type="image/svg+xml" href="/vitejs.svg">`);
  }
  if (metadata.openGraph) {
    const og = metadata.openGraph;
    if (og.title) tags.push(`<meta property="og:title" content="${og.title}">`);
    if (og.description)
      tags.push(`<meta property="og:description" content="${og.description}">`);
    if (og.image) tags.push(`<meta property="og:image" content="${og.image}">`);
    if (og.url) tags.push(`<meta property="og:url" content="${og.url}">`);
    if (og.type) tags.push(`<meta property="og:type" content="${og.type}">`);
  }
  if (metadata.twitter) {
    const tw = metadata.twitter;
    if (tw.card) tags.push(`<meta name="twitter:card" content="${tw.card}">`);
    if (tw.title)
      tags.push(`<meta name="twitter:title" content="${tw.title}">`);
    if (tw.description)
      tags.push(
        `<meta name="twitter:description" content="${tw.description}">`,
      );
    if (tw.image)
      tags.push(`<meta name="twitter:image" content="${tw.image}">`);
    if (tw.creator)
      tags.push(`<meta name="twitter:creator" content="${tw.creator}">`);
  }
  return tags.join("\n            ");
}
