import React from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-red-600 text-white p-4 font-bold shadow-md">
        My App Header
      </header>
      <main className="grow p-4">{children}</main>
      <footer className="bg-blue-600 text-white p-4 shadow-inner">
        My App Footer
      </footer>
    </div>
  );
}
