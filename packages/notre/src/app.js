import { createApp } from "vinxi";
import { notreRouter } from "./router.js";
import tsconfigPaths from "vite-tsconfig-paths";
import { notreValidationPlugin } from "./vite-plugin.js";
import tailwindcss from "@tailwindcss/vite";
export function defineConfig(options = {}) {
  const appRoot = options.appRoot || "./src";
  const publicDir = options.publicDir || "./public";
  return createApp({
    server: {
      preset: "node-server",
      ...options.server,
    },
    routers: [
      {
        name: "public",
        type: "static",
        dir: publicDir,
      },
      {
        name: "ssr",
        type: "http",
        handler: `${appRoot}/entry-server.tsx`,
        link: {
          client: "client",
        },
        plugins: () => [
          notreValidationPlugin({ type: "server" }),
          tsconfigPaths(),
          tailwindcss(),
        ],
        routes: (router, app) =>
          new notreRouter(
            {
              dir: `${appRoot}/pages`,
              extensions: ["tsx", "ts", "jsx", "js"],
            },
            router,
            app,
          ),
      },
      {
        name: "client",
        type: "client",
        handler: `${appRoot}/entry-client.tsx`,
        target: "browser",
        base: "/_build",
        plugins: () => [
          notreValidationPlugin({ type: "client" }),
          tsconfigPaths(),
          tailwindcss(),
        ],
        routes: (router, app) =>
          new notreRouter(
            {
              dir: `${appRoot}/pages`,
              extensions: ["tsx", "ts", "jsx", "js"],
            },
            router,
            app,
          ),
      },
    ],
  });
}
