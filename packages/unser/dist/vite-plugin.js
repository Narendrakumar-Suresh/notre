import { validateComponentUsage } from "./validator.js";
export function notreValidationPlugin({ type, }) {
    return {
        name: "notre-validation",
        enforce: "pre",
        transform(code, id) {
            // Skip entry files - they are framework infrastructure
            if (id.includes("entry-client.tsx") || id.includes("entry-server.tsx")) {
                return null;
            }
            // Check all tsx/jsx files, not just pages
            if (/\.(tsx|jsx)$/.test(id) && !id.includes("node_modules")) {
                try {
                    validateComponentUsage(code, id);
                }
                catch (error) {
                    // Use this.error to stop the build
                    throw error;
                }
            }
            return null;
        },
    };
}
