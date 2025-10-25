import { BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";
import type { Route } from "./types.js";

export class notreRouter extends BaseFileSystemRouter {
  toPath(src: string): string {
    const routePath = cleanPath(src, this.config)
      .slice(1)
      .replace(/index$/, "")
      .replace(/\[(.*?)\]/g, ":$1");

    // Remove trailing slash for consistency
    const path = routePath ? `/${routePath}` : "/";
    return path.replace(/\/$/, "") || "/";
  }

  toRoute(filePath: string): Route | null {
    if (filePath.includes("layout.")) {
      return null;
    }

    return {
      path: this.toPath(filePath),
      filePath,
      $component: {
        src: filePath,
        pick: [
          "default",
          "getServerSideProps",
          "getStaticProps",
          "ssr",
          "client",
        ],
      },
    };
  }
}
