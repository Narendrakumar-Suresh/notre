import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const metadata = ({ params }) => ({
    title: `${params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Blog`,
    description: `Read about ${params.slug.replace(/-/g, ' ')}`,
    openGraph: { type: 'article' }
});
export default function BlogPost({ params }) {
    return (_jsx("div", { className: "bg-black h-screen", children: _jsxs("h1", { className: "bg-red-700 w-fit text-4xl font-mono", children: ["Blog Post: ", _jsx("span", { className: "text-gray-300", children: params.slug })] }) }));
}
