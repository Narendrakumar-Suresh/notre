export interface Route {
  path: string;
  filePath: string;
  $component: {
    src: string;
    pick: string[];
  };
}

export interface Metadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image" | "app" | "player";
    title?: string;
    description?: string;
    image?: string;
    creator?: string;
  };
  robots?: string;
  canonical?: string;
  favicon?: string;
}

export type MetadataFunction = (context: {
  params: Record<string, string>;
  event?: any;
}) => Metadata | Promise<Metadata>;

export interface notreAppOptions {
  appRoot?: string;
  publicDir?: string;
  server?: any;
  root?: string;
}
