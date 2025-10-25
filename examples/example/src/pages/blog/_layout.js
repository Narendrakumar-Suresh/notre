import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function RootLayout({ children }) {
    return (_jsxs("div", { children: [_jsx("header", { children: "Blog Header" }), _jsx("main", { children: children }), _jsx("footer", { children: "Blog Footer" })] }));
}
