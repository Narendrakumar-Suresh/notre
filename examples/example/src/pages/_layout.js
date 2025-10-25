import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function RootLayout({ children, }) {
    return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx("header", { className: "bg-red-600 text-white p-4 font-bold shadow-md", children: "My App Header" }), _jsx("main", { className: "grow p-4", children: children }), _jsx("footer", { className: "bg-blue-600 text-white p-4 shadow-inner", children: "My App Footer" })] }));
}
