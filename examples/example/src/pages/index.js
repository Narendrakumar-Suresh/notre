import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Counter from "../components/Counter";
export const metadata = {
  title: "Home - notre Framework",
  description: "Welcome to notre - A modern React framework with SSR support",
  keywords: "react, ssr, framework, notre",
  openGraph: {
    title: "notre Framework",
    description: "A modern React framework",
    type: "website",
  },
};
export default function Home() {
  return _jsxs("div", {
    children: [
      _jsx("h1", { children: "Welcome to notre!" }),
      _jsx(Counter, {}),
    ],
  });
}
