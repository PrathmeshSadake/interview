import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  LocalTrack,
  Track,
  LocalTrackPublication,
} from "livekit-client";
import { createLocalAudioTrack } from "livekit-client";

// This service handles LiveKit integration for real-time voice communication
class LiveKitService {
  private room: Room | null = null;
  private localParticipant: LocalParticipant | null = null;
  private onAudioReceived: ((transcript: string) => void) | null = null;
  private apiKey: string = "";
  private livekitUrl: string = "";
  private deepgramApiKey: string = "";
  private elevenLabsApiKey: string = "";
  private openAiApiKey: string = "";

  // Initialize with API keys
  init(config: {
    livekitUrl?: string;
    apiKey?: string;
    deepgramApiKey?: string;
    elevenLabsApiKey?: string;
    openAiApiKey?: string;
  }) {
    this.livekitUrl = config.livekitUrl || "";
    this.apiKey = config.apiKey || "";
    this.deepgramApiKey = config.deepgramApiKey || "";
    this.elevenLabsApiKey = config.elevenLabsApiKey || "";
    this.openAiApiKey = config.openAiApiKey || "";
  }

  // Connect to a LiveKit room
  async connect(
    userName: string,
    onAudioCallback: (transcript: string) => void
  ) {
    try {
      if (!this.livekitUrl || !this.apiKey) {
        console.error("LiveKit URL and API key must be configured");
        return false;
      }

      this.onAudioReceived = onAudioCallback;

      // Create and connect to room
      this.room = new Room();

      // Set up event listeners
      this.room.on(
        RoomEvent.TrackSubscribed,
        this.handleTrackSubscribed.bind(this)
      );

      // Get token from API
      const token = await this.getToken(userName);
      if (!token) {
        console.error("Failed to get LiveKit token");
        return false;
      }

      // Connect to room
      await this.room.connect(this.livekitUrl, token);

      // Get local participant
      this.localParticipant = this.room.localParticipant;

      console.log("Connected to LiveKit room:", this.room.name);
      return true;
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
      return false;
    }
  }

  // Get token from server
  private async getToken(userName: string) {
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get token");
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }

  // Connect to LiveKit Agent
  async connectToAgent(
    userName: string,
    onTranscriptReceived: (text: string) => void
  ) {
    try {
      // In production, we would make an API call to your backend which would handle the
      // connection to the LiveKit agent. For now we'll use a placeholder implementation
      const roomName = `interview-${Date.now()}`;

      // Make API call to start agent session
      const response = await fetch("/api/livekit/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          roomName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start LiveKit agent");
      }

      // Connect to the room where the agent is
      const success = await this.connect(userName, onTranscriptReceived);
      return success;
    } catch (error) {
      console.error("Failed to connect to LiveKit agent:", error);
      return false;
    }
  }

  // Disconnect from the room
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
      this.localParticipant = null;
      this.onAudioReceived = null;
      console.log("Disconnected from LiveKit room");
    }
  }

  // Start audio capture from user microphone
  async startMicrophone() {
    if (!this.localParticipant) {
      console.error("Not connected to a room");
      return false;
    }

    try {
      // Request microphone access
      const microphoneTrack = await createLocalAudioTrack();

      // Publish the track to the room
      await this.localParticipant.publishTrack(microphoneTrack);

      console.log("Microphone started and publishing");
      return true;
    } catch (error) {
      console.error("Failed to start microphone:", error);
      return false;
    }
  }

  // Stop microphone capture
  async stopMicrophone() {
    if (!this.localParticipant) {
      return;
    }

    // Use the built-in method to disable microphone
    await this.localParticipant.setMicrophoneEnabled(false);

    console.log("Microphone stopped");
  }

  // Handle incoming audio tracks from remote participants
  private handleTrackSubscribed(
    track: Track,
    publication: any,
    participant: RemoteParticipant
  ) {
    if (track.kind === Track.Kind.Audio) {
      console.log(
        "Received audio from remote participant:",
        participant.identity
      );

      // In a real implementation with LiveKit agents, the agent would already handle
      // the audio processing and send transcriptions through a data channel
      // For now, we'll simulate this behavior

      if (this.onAudioReceived) {
        // In a full implementation, this would be the result of the agent's processing
        this.onAudioReceived("Response from interview bot will appear here");
      }
    }
  }
}

// Export a singleton instance
export const livekitService = new LiveKitService();
