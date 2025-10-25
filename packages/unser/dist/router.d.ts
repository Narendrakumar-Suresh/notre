import { BaseFileSystemRouter } from "vinxi/fs-router";
import type { Route } from "./types.js";
export declare class notreRouter extends BaseFileSystemRouter {
    toPath(src: string): string;
    toRoute(filePath: string): Route | null;
}
