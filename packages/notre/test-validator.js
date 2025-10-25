import { validateComponentUsage } from "./src/validator.js";

const testCode = `import React, { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}`;

try {
  validateComponentUsage(testCode, "test.tsx");
  console.log("❌ FAILED: Should have thrown an error!");
} catch (error) {
  console.log("✅ SUCCESS: Validation caught the error:");
  console.log(error.message);
}
