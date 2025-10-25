import { parseSync } from "@swc/core";
const CLIENT_ONLY_HOOKS = new Set([
    "useState",
    "useEffect",
    "useLayoutEffect",
    "useRef",
    "useCallback",
    "useMemo",
    "useReducer",
    "useContext",
    "useImperativeHandle",
    "useDebugValue",
    "useDeferredValue",
    "useTransition",
    "useId",
    "useSyncExternalStore",
    "useInsertionEffect",
]);
const BROWSER_APIS = new Set([
    "window",
    "document",
    "navigator",
    "localStorage",
    "sessionStorage",
    "location",
    "history",
]);
function checkNode(node, hasCsrExport, reactImports, reactNamespace, issues, skipImports = false) {
    if (!node || typeof node !== "object")
        return;
    // Skip import/export declarations to avoid false positives
    if (node.type === "ImportDeclaration" || node.type === "ExportDeclaration") {
        return;
    }
    // Check for React.useState() pattern (MemberExpression)
    if (node.type === "MemberExpression" && !hasCsrExport) {
        if (node.object?.type === "Identifier" &&
            node.object.value === reactNamespace &&
            node.property?.type === "Identifier" &&
            CLIENT_ONLY_HOOKS.has(node.property.value)) {
            issues.push(`Hook '${node.property.value}' requires 'export const csr = true'`);
        }
    }
    // Check identifiers for hooks and browser APIs
    if (node.type === "Identifier" && !hasCsrExport) {
        const name = node.value;
        if (reactImports.has(name) && CLIENT_ONLY_HOOKS.has(name)) {
            issues.push(`Hook '${name}' requires 'export const csr = true'`);
        }
        if (BROWSER_APIS.has(name)) {
            issues.push(`Browser API '${name}' requires 'export const csr = true'`);
        }
    }
    // Recursively check all properties
    for (const key in node) {
        const value = node[key];
        if (Array.isArray(value)) {
            value.forEach((item) => checkNode(item, hasCsrExport, reactImports, reactNamespace, issues));
        }
        else if (value && typeof value === "object") {
            checkNode(value, hasCsrExport, reactImports, reactNamespace, issues);
        }
    }
}
export function validateComponentUsage(code, filePath) {
    const ast = parseSync(code, {
        syntax: "typescript",
        tsx: true,
    });
    let hasCsrExport = false;
    const reactImports = new Set();
    let reactNamespace = null;
    const issues = [];
    // First pass: collect exports and imports
    for (const item of ast.body) {
        // Check for export const csr = true
        if (item.type === "ExportDeclaration") {
            const decl = item.declaration;
            if (decl.type === "VariableDeclaration") {
                for (const declarator of decl.declarations) {
                    if (declarator.id.type === "Identifier" &&
                        declarator.id.value === "csr") {
                        hasCsrExport = true;
                    }
                }
            }
        }
        // Collect React imports
        if (item.type === "ImportDeclaration") {
            const imp = item;
            if (imp.source.value === "react") {
                for (const spec of imp.specifiers) {
                    if (spec.type === "ImportSpecifier") {
                        // import { useState } from 'react'
                        reactImports.add(spec.local.value);
                    }
                    else if (spec.type === "ImportDefaultSpecifier") {
                        // import React from 'react'
                        reactNamespace = spec.local.value;
                    }
                    else if (spec.type === "ImportNamespaceSpecifier") {
                        // import * as React from 'react'
                        reactNamespace = spec.local.value;
                    }
                }
            }
        }
    }
    // Second pass: check usage
    checkNode(ast, hasCsrExport, reactImports, reactNamespace, issues);
    if (issues.length > 0) {
        const uniqueIssues = [...new Set(issues)];
        throw new Error(`\n❌ Validation failed in ${filePath}:\n${uniqueIssues.map((i) => `   • ${i}`).join("\n")}\n`);
    }
}
