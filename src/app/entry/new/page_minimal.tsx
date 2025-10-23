"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function NewEntry() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    valence: 5,
    energy: 5,
    focus: 5,
    stress: 5,
    sleep: 8,
    notes: "",
    activities: [] as string[],
    reflection: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: number | string | string[]) => {
    try {
      setError(null);
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error in handleChange:', error);
      setError(`Error updating ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/mood-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowReflection(true);
        return;
      } else {
        const errorData = await response.json();
        alert(`Failed to save mood entry: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving mood entry:", error);
      setError(`Failed to save mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReflectionSubmit = async () => {
    setIsSubmitting(true);
    try {
      router.push("/stats");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">New Mood Entry</h1>
        <p className="text-lg text-gray-600">Capture your current state and reflections</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <div className="text-red-800 font-medium">Error:</div>
          </div>
          <div className="text-red-700 mt-1">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!showReflection && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valence (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.valence}
              onChange={(e) => handleChange("valence", parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </Card>

          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Energy (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.energy}
              onChange={(e) => handleChange("energy", parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </Card>

          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.focus}
              onChange={(e) => handleChange("focus", parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </Card>

          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stress (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.stress}
              onChange={(e) => handleChange("stress", parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </Card>

          <Card className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep (hours)
            </label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formData.sleep}
              onChange={(e) => handleChange("sleep", parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Notes</h3>
            </div>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
              placeholder="Any specific thoughts or observations? (Optional)"
            />
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      )}

      {showReflection && (
        <div className="space-y-6">
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4">✅ Entry Saved Successfully!</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">Valence:</span>
                <span className="ml-2 text-green-800">{formData.valence}/10</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Energy:</span>
                <span className="ml-2 text-green-800">{formData.energy}/10</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Focus:</span>
                <span className="ml-2 text-green-800">{formData.focus}/10</span>
              </div>
              <div>
                <span className="text-green-700 font-medium">Stress:</span>
                <span className="ml-2 text-green-800">{formData.stress}/10</span>
              </div>
            </div>
            {formData.activities.length > 0 && (
              <div className="mt-3">
                <span className="text-green-700 font-medium">Activities:</span>
                <span className="ml-2 text-green-800">{formData.activities.join(", ")}</span>
              </div>
            )}
            {formData.notes && (
              <div className="mt-3">
                <span className="text-green-700 font-medium">Notes:</span>
                <span className="ml-2 text-green-800">{formData.notes}</span>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Reflection</h3>
            <p className="text-gray-700 mb-4">What's one word that describes your day?</p>
            <textarea
              rows={4}
              value={formData.reflection || ""}
              onChange={(e) => {
                console.log('Reflection onChange triggered:', e.target.value);
                handleChange("reflection", e.target.value);
              }}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3"
              placeholder="Write your reflection here..."
            />
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleReflectionSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving Reflection..." : "Save Reflection & Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
