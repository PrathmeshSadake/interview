// This service handles Deepgram speech-to-text integration
class DeepgramService {
  private apiKey: string = "";
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isListening: boolean = false;
  private onTranscriptReady: ((transcript: string) => void) | null = null;
  private socket: WebSocket | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  // Initialize with API key
  init(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Start listening for speech
  async startListening(
    callback: (transcript: string) => void
  ): Promise<boolean> {
    if (!this.apiKey) {
      console.error("Deepgram API key not configured");
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up WebSocket connection to Deepgram
      const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
        "token",
        this.apiKey,
      ]);

      this.socket = socket;
      this.onTranscriptReady = callback;

      // Configure socket event handlers
      socket.onopen = () => {
        console.log("Deepgram WebSocket connected");

        // Send configuration
        socket.send(
          JSON.stringify({
            samplingRate: 16000,
            encoding: "linear16",
            language: "en",
            model: "nova-2",
            punctuate: true,
            utterances: true,
            vad_turnoff: 1000, // 1 second of silence to end utterance
          })
        );

        // Keep the WebSocket connection alive
        this.keepAliveInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, 10000);

        // Set up MediaRecorder
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            this.audioChunks.push(event.data);

            // Convert Blob to ArrayBuffer and send to Deepgram
            const reader = new FileReader();
            reader.onload = () => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(reader.result as ArrayBuffer);
              }
            };
            reader.readAsArrayBuffer(event.data);
          }
        };

        // Start recording
        this.mediaRecorder.start(100); // Collect data in 100ms chunks
        this.isListening = true;
      };

      socket.onmessage = (event) => {
        const response = JSON.parse(event.data);

        // Check if we have a transcript with confidence
        if (
          response.channel &&
          response.channel.alternatives &&
          response.channel.alternatives.length > 0 &&
          response.channel.alternatives[0].transcript &&
          response.is_final
        ) {
          const transcript = response.channel.alternatives[0].transcript.trim();

          // Only process if the transcript has content and is final
          if (transcript && response.is_final && this.onTranscriptReady) {
            this.onTranscriptReady(transcript);
          }
        }
      };

      socket.onerror = (error) => {
        console.error("Deepgram WebSocket error:", error);
        this.stopListening();
      };

      socket.onclose = () => {
        console.log("Deepgram WebSocket closed");
        this.stopListening();
      };

      return true;
    } catch (error) {
      console.error("Failed to start speech recognition with Deepgram:", error);
      this.stopListening();
      return false;
    }
  }

  // Stop listening for speech
  stopListening(): boolean {
    if (!this.isListening) {
      return false;
    }

    try {
      // Stop the media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();

        // Stop all tracks in the stream
        const stream = this.mediaRecorder.stream;
        stream.getTracks().forEach((track) => track.stop());
      }

      // Close the WebSocket
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }

      // Clear the keep-alive interval
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }

      this.mediaRecorder = null;
      this.socket = null;
      this.audioChunks = [];
      this.isListening = false;

      return true;
    } catch (error) {
      console.error("Error stopping Deepgram speech recognition:", error);
      return false;
    }
  }

  // Check if speech recognition is supported in this browser
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.WebSocket &&
      window.MediaRecorder
    );
  }
}

// Export a singleton instance
export const deepgramService = new DeepgramService();
