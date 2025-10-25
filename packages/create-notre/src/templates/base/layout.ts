export const getLayout = (tailwind: boolean) => `
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div${tailwind ? ' className="flex flex-col min-h-screen"' : ''}>
      <header${tailwind ? ' className="bg-blue-600 text-white p-4 font-bold shadow-md"' : ''}>
        My App
      </header>
      <main${tailwind ? ' className="grow p-4"' : ''}>{children}</main>
      <footer${tailwind ? ' className="bg-gray-800 text-white p-4 text-center"' : ''}>
        © 2025 My App
      </footer>
    </div>
  );
}
`;
