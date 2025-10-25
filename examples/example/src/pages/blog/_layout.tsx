import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header>Blog Header</header>
      <main>{children}</main>
      <footer>Blog Footer</footer>
    </div>
  );
}