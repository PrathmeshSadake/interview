// This service handles Deepgram speech-to-text integration
class DeepgramService {
  private apiKey: string = "";
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isListening: boolean = false;
  private onTranscriptReady: ((transcript: string) => void) | null = null;
  private socket: WebSocket | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private interimTranscript: string = "";
  private finalTranscript: string = "";
  private silenceTimer: NodeJS.Timeout | null = null;
  private isSpeaking: boolean = false;
  private silenceThreshold: number = 2500; // 2.5 seconds of silence to consider the speech complete
  private lastSpeechTime: number = 0;
  private isProcessingFinal: boolean = false;

  // Initialize with API key
  init(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Set silence threshold (milliseconds)
  setSilenceThreshold(threshold: number) {
    this.silenceThreshold = threshold;
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
      // Clear previous state
      this.interimTranscript = "";
      this.finalTranscript = "";
      this.isSpeaking = false;
      this.isProcessingFinal = false;
      this.lastSpeechTime = 0;

      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

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
            interim_results: true, // Get intermediate results
            endpointing: 500, // Endpointing sensitivity
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

        // Update lastSpeechTime when we get any kind of speech
        if (
          response.channel &&
          response.channel.alternatives &&
          response.channel.alternatives.length > 0 &&
          response.channel.alternatives[0].transcript
        ) {
          this.lastSpeechTime = Date.now();

          // If we were not speaking before, we are now
          if (!this.isSpeaking) {
            this.isSpeaking = true;

            // Clear any pending silence timer
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
          }
        }

        // Handle interim results to show feedback
        if (
          !response.is_final &&
          response.channel &&
          response.channel.alternatives &&
          response.channel.alternatives.length > 0
        ) {
          const transcript = response.channel.alternatives[0].transcript.trim();
          if (transcript) {
            this.interimTranscript = transcript;
            // Dispatch an event for UI feedback
            this.dispatchTranscriptEvent(
              this.finalTranscript + " " + this.interimTranscript,
              false
            );
          }
        }

        // Handle final results
        if (
          response.is_final &&
          response.channel &&
          response.channel.alternatives &&
          response.channel.alternatives.length > 0 &&
          response.channel.alternatives[0].transcript
        ) {
          const transcript = response.channel.alternatives[0].transcript.trim();

          if (transcript) {
            // Append to final transcript if it makes sense semantically
            if (this.finalTranscript) {
              // Check if the new transcript is a continuation
              const lastChar = this.finalTranscript.charAt(
                this.finalTranscript.length - 1
              );
              const needsPunctuation = !".?!,:;".includes(lastChar);
              this.finalTranscript +=
                (needsPunctuation ? " " : "") + transcript;
            } else {
              this.finalTranscript = transcript;
            }

            // Clear interim transcript since we've incorporated the final version
            this.interimTranscript = "";

            // Dispatch event for UI feedback
            this.dispatchTranscriptEvent(this.finalTranscript, false);

            // Start silence detection timer
            this.startSilenceDetection();
          }
        }

        // Handle speech endpoint (silence detected)
        if (response.speech_final) {
          // Only process if not already processing final transcript
          if (!this.isProcessingFinal && this.finalTranscript) {
            this.processFinalTranscript();
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

  // Start silence detection timer
  private startSilenceDetection() {
    // Clear any existing timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Start a new timer
    this.silenceTimer = setTimeout(() => {
      // If enough time has passed since the last speech, process the transcript
      const silenceTime = Date.now() - this.lastSpeechTime;
      if (
        silenceTime >= this.silenceThreshold &&
        this.finalTranscript &&
        !this.isProcessingFinal
      ) {
        this.processFinalTranscript();
      } else if (this.finalTranscript) {
        // If not enough silence yet, check again soon
        this.startSilenceDetection();
      }
    }, 500); // Check every 500ms
  }

  // Process the final transcript when the user has finished speaking
  private processFinalTranscript() {
    if (!this.finalTranscript || this.isProcessingFinal) return;

    this.isProcessingFinal = true;
    console.log("Processing final transcript:", this.finalTranscript);

    // Call the callback with the complete transcript
    if (this.onTranscriptReady) {
      // Dispatch one last UI update with finality flag
      this.dispatchTranscriptEvent(this.finalTranscript, true);

      // Send to callback
      this.onTranscriptReady(this.finalTranscript);
    }

    // Reset state
    this.finalTranscript = "";
    this.interimTranscript = "";
    this.isSpeaking = false;
    this.isProcessingFinal = false;
  }

  // Dispatch transcript update event for UI
  private dispatchTranscriptEvent(transcript: string, isFinal: boolean) {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("transcript-update", {
        detail: { transcript, isFinal },
      });
      window.dispatchEvent(event);
    }
  }

  // Stop listening for speech
  stopListening(): boolean {
    if (!this.isListening) {
      return false;
    }

    try {
      // Process any final transcript before stopping
      if (this.finalTranscript && !this.isProcessingFinal) {
        this.processFinalTranscript();
      }

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

      // Clear the silence detection timer
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      this.mediaRecorder = null;
      this.socket = null;
      this.audioChunks = [];
      this.isListening = false;
      this.interimTranscript = "";
      this.finalTranscript = "";
      this.isSpeaking = false;
      this.isProcessingFinal = false;

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
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof WebSocket !== "undefined" &&
      typeof window.MediaRecorder !== "undefined"
    );
  }

  // Get the current listening state
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Check if the user is currently speaking
  isUserSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Get current interim transcript for UI display
  getCurrentTranscript(): string {
    return (
      this.finalTranscript +
      (this.interimTranscript ? " " + this.interimTranscript : "")
    );
  }
}

// Export a singleton instance
export const deepgramService = new DeepgramService();
