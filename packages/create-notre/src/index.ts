#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prompts from "prompts";
import { red, green, cyan, bold } from "kleur/colors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ProjectConfig {
  projectName: string;
  typescript: boolean;
}

async function main() {
  console.log(bold(cyan("\n🚀 Create notre App\n")));

  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-notre-app",
      validate: (value) => {
        if (!value) return "Project name is required";
        if (!/^[a-z0-9-_]+$/i.test(value)) return "Invalid project name";
        return true;
      },
    },
    {
      type: "confirm",
      name: "typescript",
      message: "Use TypeScript?",
      initial: true,
    },
  ]);

  if (!response.projectName) {
    console.log(red("\n✖ Cancelled\n"));
    process.exit(1);
  }

  const config: ProjectConfig = response;
  const targetDir = path.resolve(process.cwd(), config.projectName);

  if (fs.existsSync(targetDir)) {
    console.log(red(`\n✖ Directory ${config.projectName} already exists\n`));
    process.exit(1);
  }

  console.log(cyan("\n📦 Creating project...\n"));
  createProject(targetDir, config);
  console.log(green(`\n✔ Project created successfully!\n`));
  console.log(bold("Next steps:"));
  console.log(`  cd ${config.projectName}`);
  console.log(`  npm install`);
  console.log(`  npm run dev\n`);
}

function createProject(targetDir: string, config: ProjectConfig) {
  fs.mkdirSync(targetDir, { recursive: true });

  const ext = config.typescript ? "tsx" : "jsx";
  const configExt = config.typescript ? "ts" : "js";

  // Create directory structure
  fs.mkdirSync(path.join(targetDir, "src", "pages"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "src", "components"), { recursive: true });
  fs.mkdirSync(path.join(targetDir, "public"), { recursive: true });

  // package.json
  writeFile(targetDir, "package.json", getPackageJson(config));

  // app.config
  writeFile(targetDir, `app.config.${configExt}`, getAppConfig(config));

  // tsconfig.json (if TypeScript)
  if (config.typescript) {
    writeFile(targetDir, "tsconfig.json", getTsConfig());
  }

  // tailwind.config
  writeFile(
    targetDir,
    `tailwind.config.${configExt}`,
    getTailwindConfig(config),
  );

  // app.css
  writeFile(targetDir, "src/app.css", getAppCss());

  // entry-client
  writeFile(targetDir, `src/entry-client.${ext}`, getEntryClient(config));

  // entry-server
  writeFile(targetDir, `src/entry-server.${ext}`, getEntryServer(config));

  // _layout
  writeFile(targetDir, `src/pages/_layout.${ext}`, getLayout(config));

  // index page
  writeFile(targetDir, `src/pages/index.${ext}`, getIndexPage(config));

  // Counter component
  writeFile(targetDir, `src/components/Counter.${ext}`, getCounter(config));

  // .gitignore
  writeFile(targetDir, ".gitignore", getGitignore());
}

function writeFile(targetDir: string, filePath: string, content: string) {
  const fullPath = path.join(targetDir, filePath);
  fs.writeFileSync(fullPath, content, "utf-8");
}

function getPackageJson(config: ProjectConfig): string {
  return JSON.stringify(
    {
      name: config.projectName,
      type: "module",
      scripts: {
        dev: "vinxi dev --host localhost",
        build: "vinxi build",
        start: "vinxi start",
      },
      dependencies: {
        react: "^19.0.2",
        "react-dom": "^19.0.2",
        notre: "^0.1.0",
        vinxi: "^0.5.8",
        "@swc/core": "^1.13.5",
      },
      devDependencies: {
        "@tailwindcss/vite": "^4.1.16",
        ...(config.typescript
          ? {
            "@types/node": "^24.9.1",
            "@types/react": "^19.0.2",
            "@types/react-dom": "^19.0.2",
            typescript: "^5.7.2",
          }
          : {}),
        tailwindcss: "^4.1.16",
      },
    },
    null,
    2,
  );
}

function getAppConfig(config: ProjectConfig): string {
  const importLine = config.typescript
    ? 'import { defineConfig } from "notre/app";'
    : 'const { defineConfig } = require("notre/app");';

  const exportLine = config.typescript ? "export default" : "module.exports =";

  return `${importLine}

${exportLine} defineConfig({
  root: process.cwd(),
  server: {
    preset: "node-server",
  },
});
`;
}

function getTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        types: ["vite/client"],
      },
      include: ["src"],
    },
    null,
    2,
  );
}

function getTailwindConfig(config: ProjectConfig): string {
  if (config.typescript) {
    return `import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
} satisfies Config;
`;
  }
  return `export default {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
};
`;
}

function getAppCss(): string {
  return '@import "tailwindcss";\n';
}

function getEntryClient(config: ProjectConfig): string {
  const imports = config.typescript
    ? `import { hydrateRoot, createRoot } from "react-dom/client";
import React from "react";
import "./app.css";`
    : `const { hydrateRoot, createRoot } = require("react-dom/client");
const React = require("react");
require("./app.css");`;

  return `${imports}

const allRoutes = import.meta.glob("./pages/**/*.{${config.typescript ? "ts,tsx" : "js,jsx"}}");

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
);

const layouts = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader])
);

function findRoute(path) {
  let pageLoader = routes[path];
  let pageParams = {};
  const layoutLoaders = [];

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
              params[routeParts[i].slice(1, -1)] = pathParts[i];
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

async function main() {
  const path = window.location.pathname;
  const props = window.__PROPS__ || {};
  const route = findRoute(path);

  if (route) {
    const { pageLoader, pageParams, layoutLoaders } = route;
    const pageMod = await pageLoader();
    let CurrentComponent = pageMod.default;

    for (let i = layoutLoaders.length - 1; i >= 0; i--) {
      const layoutMod = await layoutLoaders[i]();
      const LayoutComponent = layoutMod.default;
      const WrapperComponent = CurrentComponent;
      CurrentComponent = (componentProps) => (
        React.createElement(LayoutComponent, componentProps,
          React.createElement(WrapperComponent, componentProps)
        )
      );
    }

    const rootElement = document.getElementById("root");
    if (rootElement) {
      const app = React.createElement(CurrentComponent, { ...props, params: pageParams });
      if (pageMod.csr) {
        createRoot(rootElement).render(app);
      } else {
        hydrateRoot(rootElement, app);
      }
    }
  }
}

main();
`;
}

function getEntryServer(config: ProjectConfig): string {
  return `import { eventHandler } from "vinxi/http";
import React from "react";
import { renderToString } from "react-dom/server";
import { getManifest } from "vinxi/manifest";
import "./app.css";

const allRoutes = import.meta.glob("./pages/**/*.{${config.typescript ? "ts,tsx" : "js,jsx"}}");
const isDev = process.env.NODE_ENV !== 'production';

function toPath(path: string) {
  return (
    path
      .replace("./pages", "")
      .replace(/(\/index)?\.(ts|tsx)$/, "")
      .replace("/_layout", "") || "/"
  );
}

const routes${config.typescript ? ": Record<string, () => Promise<any>>" : ""} = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => !path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader])
);

const layouts${config.typescript ? ": Record<string, () => Promise<any>>" : ""} = Object.fromEntries(
  Object.entries(allRoutes)
    .filter(([path]) => path.includes("_layout"))
    .map(([path, loader]) => [toPath(path), loader])
);

function findRoute(path${config.typescript ? ": string" : ""}) {
  let pageLoader = routes[path];
  let pageParams${config.typescript ? ": Record<string, string>" : ""} = {};
  const layoutLoaders${config.typescript ? ": Array<() => Promise<any>>" : ""} = [];

  if (!pageLoader) {
    for (const routePath in routes) {
      if (routePath.includes("[")) {
        const routeParts = routePath.split("/").filter((p) => p);
        const pathParts = path.split("/").filter((p) => p);

        if (routeParts.length === pathParts.length) {
          const params${config.typescript ? ": Record<string, string>" : ""} = {};
          let match = true;

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith("[") && routeParts[i].endsWith("]")) {
              params[routeParts[i].slice(1, -1)] = pathParts[i];
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
  let currentPathSegments${config.typescript ? ": string[]" : ""} = [];
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

  const path = new URL(reqUrl, \`http://\${host}\`).pathname;
  const route = findRoute(path);

  if (route) {
    const { pageLoader, pageParams, layoutLoaders } = route;
    const pageMod = await pageLoader();
    let CurrentComponent = pageMod.default;

    for (let i = layoutLoaders.length - 1; i >= 0; i--) {
      const layoutMod = await layoutLoaders[i]();
      const LayoutComponent = layoutMod.default;
      const WrapperComponent = CurrentComponent;
      CurrentComponent = (componentProps${config.typescript ? ": any" : ""}) => (
        React.createElement(LayoutComponent, componentProps,
          React.createElement(WrapperComponent, componentProps)
        )
      );
    }

    const clientManifest = getManifest("client");
    const clientEntry = clientManifest.inputs[clientManifest.handler];
    const clientPath = clientEntry.output.path;

    let cssLinks = "";

    if (!isDev) {
      try {
        const fs = await import('fs');
        const pathModule = await import('path');
        const manifestPath = pathModule.join(process.cwd(), '.vinxi/build/client/_build/.vite/manifest.json');
        const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        const cssFiles = new Set${config.typescript ? "<string>" : ""}();
        const visitedChunks = new Set${config.typescript ? "<string>" : ""}();

        const collectCSS = (chunkKey${config.typescript ? ": string" : ""}) => {
          if (visitedChunks.has(chunkKey)) return;
          visitedChunks.add(chunkKey);

          const chunk = rawManifest[chunkKey];
          if (!chunk) return;

          if (Array.isArray(chunk.css)) {
            chunk.css.forEach((cssPath${config.typescript ? ": string" : ""}) => cssFiles.add(cssPath));
          }

          if (Array.isArray(chunk.imports)) {
            chunk.imports.forEach((importFile${config.typescript ? ": string" : ""}) => {
              for (const key in rawManifest) {
                if (rawManifest[key].file === \`assets/\${importFile}\` || key === importFile) {
                  collectCSS(key);
                  break;
                }
              }
            });
          }
        };

        collectCSS("virtual:$vinxi/handler/client");

        cssLinks = Array.from(cssFiles)
          .map((cssPath) => \`<link rel="stylesheet" href="/_build/\${cssPath}">\`)
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
            \${cssLinks}
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
          \${cssLinks}
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

function generateMetaTags(metadata${config.typescript ? ": any" : ""})${config.typescript ? ": string" : ""} {
  const tags${config.typescript ? ": string[]" : ""} = [];

  if (metadata.title) {
    tags.push(\`<title>\${metadata.title}</title>\`);
  } else {
    tags.push(\`<title>notre</title>\`);
  }

  if (metadata.description) {
    tags.push(\`<meta name="description" content="\${metadata.description}">\`);
  }

  if (metadata.favicon) {
    tags.push(\`<link rel="icon" href="\${metadata.favicon}">\`);
  }

  return tags.join("\\n            ");
}
`;
}

function getLayout(config: ProjectConfig): string {
  const reactImport = config.typescript
    ? 'import React from "react";'
    : 'const React = require("react");';
  const exportPrefix = config.typescript
    ? "export default"
    : "module.exports =";
  const typeAnnotation = config.typescript
    ? "{ children }: { children: React.ReactNode }"
    : "{ children }";

  return `${reactImport}

${exportPrefix} function RootLayout(${typeAnnotation}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-600 text-white p-4 font-bold shadow-md">
        My App
      </header>
      <main className="grow p-4">{children}</main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        © 2025 My App
      </footer>
    </div>
  );
}
`;
}

function getIndexPage(config: ProjectConfig): string {
  const reactImport = config.typescript
    ? 'import React from "react";\nimport Counter from "../components/Counter";'
    : 'const React = require("react");\nconst Counter = require("../components/Counter").default;';
  const exportPrefix = config.typescript
    ? "export"
    : "module.exports.metadata =";

  return `${reactImport}

${exportPrefix}${config.typescript ? " const" : ""} metadata = {
  title: "Home - notre Framework",
  description: "Welcome to notre - A modern React framework",
};

${config.typescript ? "export default" : "module.exports ="} function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">Welcome to notre!</h1>
      <Counter />
    </div>
  );
}
`;
}

function getCounter(config: ProjectConfig): string {
  const reactImport = config.typescript
    ? 'import { useState } from "react";'
    : 'const { useState } = require("react");';
  const exportPrefix = config.typescript
    ? "export default"
    : "module.exports =";

  return `${reactImport}
${config.typescript ? "export const csr = true;" : "module.exports.csr = true;"}

${exportPrefix} function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4 p-8 border border-gray-200 rounded-lg shadow-lg max-w-xs bg-white">
      <h2 className="text-2xl font-bold text-gray-800">
        Counter: <span className="text-green-600">{count}</span>
      </h2>
      <div className="flex gap-4">
        <button
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Decrement
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Increment
        </button>
      </div>
      <button
        onClick={() => setCount(0)}
        className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
      >
        Reset
      </button>
    </div>
  );
}
`;
}

function getGitignore(): string {
  return `node_modules
.vinxi
.output
dist
.env
.env.local
`;
}

main().catch(console.error);
