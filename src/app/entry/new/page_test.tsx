"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEntry() {
  const router = useRouter();
  const [reflection, setReflection] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting reflection:", reflection);
    router.push("/stats");
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">New Mood Entry</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Reflection</h3>
          <p className="text-gray-700 mb-4">What's one word that describes your day?</p>
          <textarea
            rows={4}
            value={reflection}
            onChange={(e) => {
              console.log('Textarea onChange triggered:', e.target.value);
              setReflection(e.target.value);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
            placeholder="Write your reflection here..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
}
