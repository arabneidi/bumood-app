"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import VoiceRecorder from "@/components/ui/VoiceRecorder";
import ParameterSlider from "@/components/ui/ParameterSlider";
import ActivitySelector from "@/components/ui/ActivitySelector";
import CelebrationModal from "@/components/ui/CelebrationModal";
import { motion } from "framer-motion";

export default function NewEntry() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    valence: 5,
    energy: 5,
    focus: 5,
    stress: 5,
    sleep: 8,
    activities: [] as string[],
    reflection: "",
    voiceNote: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState({
    title: "",
    description: "",
    icon: "",
    stars: 1,
    type: "achievement" as const
  });

  const reflectionPrompts = [
    "What influenced your mood most today?",
    "What's one word that describes your day?",
    "What are you grateful for right now?",
    "What was a highlight of your day?",
    "What challenged you today?",
  ];

  const getRandomReflectionPrompt = () => {
    return reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)];
  };

  const [currentReflectionPrompt, setCurrentReflectionPrompt] = useState("");

  useEffect(() => {
    setCurrentReflectionPrompt(getRandomReflectionPrompt());
  }, []);

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
        const newEntry = await response.json();
        if (newEntry.valence >= 8 && newEntry.energy >= 8) {
          setCelebrationData({
            title: "Sunshine Mood!",
            description: "You've achieved a high valence and energy score!",
            icon: "☀️",
            stars: 3,
            type: "achievement"
          });
          setShowCelebration(true);
        } else {
          router.push("/stats");
        }
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

  const handleVoiceTranscription = (text: string) => {
    setFormData(prev => ({ ...prev, voiceNote: text, reflection: text }));
    setShowVoiceRecorder(false);
  };

  const handleVoiceError = (error: string) => {
    alert(error);
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
    router.push("/stats");
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-2">New Mood Entry</h1>
        <p className="text-lg text-gray-600">Capture your current state and reflections</p>
      </motion.div>

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

      {!showCelebration && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <ParameterSlider
            label="Valence"
            value={formData.valence}
            onChange={(val) => handleChange("valence", val)}
            min={1}
            max={10}
            minLabel="Negative"
            maxLabel="Positive"
            color="from-red-400 to-green-500"
            icon="😊"
            valueLabels={{
              1: "Very Negative", 2: "Negative", 3: "Slightly Negative", 4: "Neutral-", 5: "Neutral",
              6: "Neutral+", 7: "Slightly Positive", 8: "Positive", 9: "Very Positive", 10: "Ecstatic"
            }}
          />

          <ParameterSlider
            label="Energy"
            value={formData.energy}
            onChange={(val) => handleChange("energy", val)}
            min={1}
            max={10}
            minLabel="Drained"
            maxLabel="Energized"
            color="from-blue-400 to-yellow-500"
            icon="⚡"
            valueLabels={{
              1: "Exhausted", 2: "Very Low", 3: "Low", 4: "Tired", 5: "Normal",
              6: "Rested", 7: "Active", 8: "High", 9: "Very High", 10: "Hyper"
            }}
          />

          <ParameterSlider
            label="Focus"
            value={formData.focus}
            onChange={(val) => handleChange("focus", val)}
            min={1}
            max={10}
            minLabel="Distracted"
            maxLabel="Focused"
            color="from-purple-400 to-pink-500"
            icon="🎯"
            valueLabels={{
              1: "Completely Distracted", 2: "Very Distracted", 3: "Distracted", 4: "Wandering", 5: "Moderate",
              6: "Attentive", 7: "Engaged", 8: "Highly Focused", 9: "Deep Focus", 10: "Laser Focus"
            }}
          />

          <ParameterSlider
            label="Stress"
            value={formData.stress}
            onChange={(val) => handleChange("stress", val)}
            min={1}
            max={10}
            minLabel="Calm"
            maxLabel="Stressed"
            color="from-green-400 to-red-500"
            icon="😟"
            valueLabels={{
              1: "Zen Master", 2: "Very Calm", 3: "Calm", 4: "Relaxed", 5: "Mild",
              6: "Moderate", 7: "Elevated", 8: "High", 9: "Very High", 10: "Overwhelmed"
            }}
          />

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

          <ActivitySelector
            selectedActivities={formData.activities}
            onActivityToggle={(activity) => {
              const newActivities = formData.activities.includes(activity)
                ? formData.activities.filter(a => a !== activity)
                : [...formData.activities, activity];
              handleChange("activities", newActivities);
            }}
          />

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quick Reflection</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
              >
                🎤 Voice
              </Button>
            </div>
            <p className="text-gray-700 mb-4">{currentReflectionPrompt}</p>
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
            {formData.voiceNote && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Voice Note:</strong> {formData.voiceNote}
                </p>
              </div>
            )}
          </Card>

          <div className="flex justify-between">
            <Button variant="outline">
              <Link href="/">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      )}

      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-md w-full mx-4">
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              onError={handleVoiceError}
            />
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowVoiceRecorder(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCelebration && (
        <CelebrationModal
          isOpen={showCelebration}
          title={celebrationData.title}
          description={celebrationData.description}
          icon={celebrationData.icon}
          stars={celebrationData.stars}
          type={celebrationData.type}
          onClose={handleCloseCelebration}
        />
      )}
    </div>
  );
}
