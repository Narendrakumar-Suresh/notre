export const getAppConfig = (runtime: "node" | "bun" | "deno") => {
  const preset = runtime === "node" ? "node-server" : runtime;
  return `
import { defineConfig }s from "notre/app";

export default defineConfig({
  server: {
    preset: "${preset}",
  },
});
`;
};
