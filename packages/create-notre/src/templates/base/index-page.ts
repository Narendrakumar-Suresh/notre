export const getIndexPage = (tailwind: boolean) => `
import React from "react";
import Counter from "../components/Counter";

export const metadata = {
  title: "Home - notre Framework",
  description: "Welcome to notre - A modern React framework",
};

export default function Home() {
  return (
    <div>
      <h1${tailwind ? ' className="text-4xl font-bold mb-4"' : ""}>Welcome to notre!</h1>
      <Counter />
    </div>
  );
}
`;
