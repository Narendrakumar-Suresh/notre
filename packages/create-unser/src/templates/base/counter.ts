export const getCounter = (tailwind: boolean) => `
import { useState } from "react";

export const csr = true;

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div${tailwind ? ' className="flex flex-col items-center gap-4 p-8 border border-gray-200 rounded-lg shadow-lg max-w-xs bg-white"' : ''}>
      <h2${tailwind ? ' className="text-2xl font-bold text-gray-800"' : ''}>
        Counter: <span${tailwind ? ' className="text-green-600"' : ''}>{count}</span>
      </h2>
      <div${tailwind ? ' className="flex gap-4"' : ''}>
        <button
          onClick={() => setCount(count - 1)}
          ${tailwind ? ' className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"' : ''}
        >
          Decrement
        </button>
        <button
          onClick={() => setCount(count + 1)}
          ${tailwind ? ' className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"' : ''}
        >
          Increment
        </button>
      </div>
      <button
        onClick={() => setCount(0)}
        ${tailwind ? ' className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"' : ''}
      >
        Reset
      </button>
    </div>
  );
}
`;
