import { defineConfig } from "notre/app";

export default defineConfig({
  root: process.cwd(),
  server: {
    preset: "node-server",
  },
  // plugins: [css()],
});
