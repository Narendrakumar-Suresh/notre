import { hydrateRoot, createRoot } from "react-dom/client";
import React from "react";
import RootLayout from "./pages/_layout";
import "./app.css";

// At the end of the generated entry-client code
if (import.meta.hot) {
  import.meta.hot.accept();
}

const allRoutes = import.meta.glob("./pages/**/*.{ts,tsx}");

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
  let pageParams = {};
  const layoutLoaders = [];

  // Find page
  // Exact match
  if (routes[path]) {
    pageLoader = routes[path];
  }

  // Dynamic route match
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

  if (!pageLoader) {
    return null;
  }

  // Collect layouts
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

async function main() {
  const path = window.location.pathname;
  const props = (window as any).__PROPS__ || {};

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
      CurrentComponent = (componentProps: any) => (
        <LayoutComponent {...componentProps}>
          <WrapperComponent {...componentProps} />
        </LayoutComponent>
      );
    }

    const rootElement = document.getElementById("root");
    if (rootElement) {
      const app = React.createElement(CurrentComponent, {
        ...props,
        params: pageParams,
      });
      if (pageMod.csr) {
        createRoot(rootElement).render(app);
      } else {
        hydrateRoot(rootElement, app);
      }
    }
  }
}

main();
