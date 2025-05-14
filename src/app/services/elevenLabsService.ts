// This service handles ElevenLabs text-to-speech integration
class ElevenLabsService {
  private apiKey: string = "";
  private voiceId: string = "EXAVITQu4vr4xnSDxMaL"; // Default voice ID (Rachel)
  private isPlaying: boolean = false;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Create audio element for playback
      this.audioElement = new Audio();
      this.audioElement.onended = () => {
        this.isPlaying = false;
      };
    }
  }

  // Initialize with API key
  init(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Set voice ID
  setVoice(voiceId: string) {
    this.voiceId = voiceId;
  }

  // Convert text to speech and play
  async speak(text: string, onEnd?: () => void): Promise<boolean> {
    if (!this.apiKey) {
      console.error("ElevenLabs API key not configured");
      return false;
    }

    try {
      // Stop any currently playing audio
      this.stop();

      const response = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: this.voiceId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (this.audioElement) {
        this.audioElement.src = audioUrl;
        this.audioElement.onended = () => {
          this.isPlaying = false;
          if (onEnd) onEnd();
          URL.revokeObjectURL(audioUrl);
        };

        this.isPlaying = true;
        await this.audioElement.play();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error generating speech with ElevenLabs:", error);
      return false;
    }
  }

  // Stop audio playback
  stop() {
    if (this.audioElement && this.isPlaying) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
    }
  }

  // Check if audio is currently playing
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Get available voices
  async getVoices(): Promise<{ id: string; name: string }[]> {
    if (!this.apiKey) {
      console.error("ElevenLabs API key not configured");
      return [];
    }

    try {
      const response = await fetch("/api/elevenlabs/voices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get voices");
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error("Error getting ElevenLabs voices:", error);
      return [];
    }
  }
}

// Export a singleton instance
export const elevenLabsService = new ElevenLabsService();
