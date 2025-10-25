import React from "react";

export const ssr = true;

export function getServerSideProps() {
  return {
    props: {
      message: "This is an SSR page from the notre framework!",
    },
  };
}

export default function notreSsrPage({ message }: { message: string }) {
  return (
    <div>
      <h1>{message}</h1>
      <p>This page demonstrates SSR capabilities of notre.</p>
    </div>
  );
}
