import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ssr = true;
export function getServerSideProps() {
    return {
        props: {
            message: "This is an SSR page from the notre framework!",
        },
    };
}
export default function notreSsrPage({ message }) {
    return (_jsxs("div", { children: [_jsx("h1", { children: message }), _jsx("p", { children: "This page demonstrates SSR capabilities of notre." })] }));
}
