import React from "react";
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
  return (
    <div>
      <h1>Welcome to notre!</h1>
      <Counter />
    </div>
  );
}
