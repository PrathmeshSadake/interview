"use client";
import { useState, useEffect } from "react";
import { elevenLabsService } from "../services/elevenLabsService";

interface ElevenLabsVoiceSelectorProps {
  onChange: (voiceId: string) => void;
  className?: string;
}

export default function ElevenLabsVoiceSelector({
  onChange,
  className = "",
}: ElevenLabsVoiceSelectorProps) {
  const [voices, setVoices] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState("");

  useEffect(() => {
    const loadVoices = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/elevenlabs/voices");
        if (!response.ok) {
          throw new Error("Failed to fetch voices");
        }

        const data = await response.json();

        if (data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);

          // Set default voice if available
          if (data.voices.length > 0) {
            setSelectedVoice(data.voices[0].id);
            onChange(data.voices[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading ElevenLabs voices:", error);
        // Provide some default voices as fallback
        const defaultVoices = [
          { id: "EXAVITQu4vr4xnSDxMaL", name: "Rachel" },
          { id: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
          { id: "jBpfuIE2acCO8z3wKNLl", name: "Callum" },
        ];
        setVoices(defaultVoices);
        setSelectedVoice(defaultVoices[0].id);
        onChange(defaultVoices[0].id);
      } finally {
        setLoading(false);
      }
    };

    loadVoices();
  }, [onChange]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = e.target.value;
    setSelectedVoice(voiceId);
    onChange(voiceId);

    // Update the ElevenLabs service
    elevenLabsService.setVoice(voiceId);
  };

  if (loading) {
    return (
      <div
        className={`animate-pulse h-10 bg-gray-700/50 rounded-md ${className}`}
      ></div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor="voice-selector"
        className="block text-sm font-medium text-gray-400 mb-1"
      >
        Voice
      </label>
      <select
        id="voice-selector"
        value={selectedVoice}
        onChange={handleVoiceChange}
        className="w-full bg-gray-800/70 border border-gray-700 text-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
}
