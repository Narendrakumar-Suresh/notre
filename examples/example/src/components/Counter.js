import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const csr = true;
export default function Counter() {
    const [count, setCount] = useState(0);
    const increment = () => setCount((prev) => prev + 1);
    const decrement = () => setCount((prev) => prev - 1);
    const reset = () => setCount(0);
    return (_jsxs("div", { className: "flex flex-col items-center gap-4 p-8 border border-gray-200 rounded-lg shadow-lg max-w-xs mx-auto bg-white", children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-800", children: ["Counter: ", _jsx("span", { className: "text-green-600", children: count })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: decrement, className: "px-4 py-2 text-lg font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors", children: "Decrement" }), _jsx("button", { onClick: increment, className: "px-4 py-2 text-lg font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors", children: "Increment" })] }), _jsx("button", { onClick: reset, className: "px-4 py-2 text-lg font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors", children: "Reset" })] }));
}
