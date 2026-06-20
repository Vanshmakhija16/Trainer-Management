"use client";
import { useState } from "react";

// 1. Removed "async" keyword
export default function TestPage({ initialCount = 0 }: { initialCount?: number } = {}) {
  // 2. State initialized correctly with the prop
  const [count, setCount] = useState(initialCount);

  function increaseCount() {
    setCount((prev) => prev + 1);
  }

  return (
    <div className="grid justify-center items-center min-h-screen">
      <div>
        <p className="text-2xl font-bold mb-4">Trainer Count: {count}</p>
      {/* 3. Simplified the onClick handler */}
        <button
          onClick={increaseCount}
          className="bg-white px-4 py-2 text-black border rounded-lg hover:bg-gray-100 transition" 
        >
          Increase
        </button>
      </div>
    </div>
  );
}
