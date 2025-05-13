// This service handles speech recognition and text-to-speech functionality
class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening: boolean = false;
  private onTranscriptReady: ((transcript: string) => void) | null = null;
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private pauseTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize if browser supports the APIs
    if (typeof window !== 'undefined') {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // @ts-ignore - TypeScript doesn't know about webkitSpeechRecognition
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognitionAPI();
        this.setupRecognition();
      }

      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    }
  }

  // Set up speech recognition properties
  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.finalTranscript = '';
      this.interimTranscript = '';
      console.log('Speech recognition started');
    };

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript;
        } else {
          this.interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // If we have a final transcript, process it
      if (this.finalTranscript && this.onTranscriptReady) {
        // Clear any existing pause timeout
        if (this.pauseTimeout) {
          clearTimeout(this.pauseTimeout);
          this.pauseTimeout = null;
        }
        
        // Set a timeout to trigger onTranscriptReady after a pause in speaking
        this.pauseTimeout = setTimeout(() => {
          if (this.onTranscriptReady && this.finalTranscript) {
            this.onTranscriptReady(this.finalTranscript.trim());
            this.finalTranscript = '';
          }
        }, 1500); // Wait for 1.5 seconds of silence before considering the speech complete
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Restart recognition if it was interrupted by a network error
      if (event.error === 'network' && this.isListening) {
        this.stopListening();
        setTimeout(() => {
          if (this.onTranscriptReady) {
            this.startListening(this.onTranscriptReady);
          }
        }, 1000);
      }
    };
    
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Restart if we're still supposed to be listening
      if (this.isListening) {
        try {
          this.recognition?.start();
        } catch (error) {
          console.error('Error restarting speech recognition:', error);
          this.isListening = false;
        }
      }
    };
  }

  // Start listening for speech
  startListening(callback: (transcript: string) => void): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.onTranscriptReady = callback;
      this.finalTranscript = '';
      this.interimTranscript = '';
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  // Stop listening for speech
  stopListening(): boolean {
    if (!this.recognition || !this.isListening) {
      return false;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
      
      // Process any remaining transcript
      if (this.finalTranscript && this.onTranscriptReady) {
        this.onTranscriptReady(this.finalTranscript.trim());
        this.finalTranscript = '';
      }
      
      return true;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
      return false;
    }
  }

  // Speak text using text-to-speech
  speak(text: string, onEnd?: () => void): boolean {
    if (!this.synthesis) {
      console.error('Speech synthesis not supported in this browser');
      return false;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language and voice properties
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a natural sounding voice if available
    let voices = this.synthesis.getVoices();
    
    // If voices array is empty, wait for voices to load and try again
    if (voices.length === 0) {
      this.synthesis.onvoiceschanged = () => {
        voices = this.synthesis.getVoices();
        this.selectVoiceAndSpeak(utterance, voices, text, onEnd);
      };
    } else {
      this.selectVoiceAndSpeak(utterance, voices, text, onEnd);
    }
    
    return true;
  }
  
  // Helper method to select a voice and speak the text
  private selectVoiceAndSpeak(
    utterance: SpeechSynthesisUtterance, 
    voices: SpeechSynthesisVoice[], 
    text: string, 
    onEnd?: () => void
  ) {
    // Try to find a good voice, prioritizing more natural sounding ones
    const preferredVoice = voices.find(voice => 
      (voice.name.includes('Google') && voice.name.includes('Female')) || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Natural')
    ) || 
    voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft')
    ) ||
    voices.find(voice => voice.lang === 'en-US');
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Set end callback if provided
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    // Add error handling
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      if (onEnd) onEnd();
    };

    // Split long text into sentences for more natural speech
    if (text.length > 200) {
      const sentences = text
        .replace(/([.?!])\s+/g, '$1|')
        .split('|')
        .filter(sentence => sentence.trim().length > 0);
      
      let sentenceIndex = 0;
      
      const speakNextSentence = () => {
        if (sentenceIndex < sentences.length) {
          const sentenceUtterance = new SpeechSynthesisUtterance(sentences[sentenceIndex]);
          sentenceUtterance.voice = utterance.voice;
          sentenceUtterance.rate = utterance.rate;
          sentenceUtterance.pitch = utterance.pitch;
          sentenceUtterance.volume = utterance.volume;
          
          sentenceUtterance.onend = () => {
            sentenceIndex++;
            speakNextSentence();
          };
          
          sentenceUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            sentenceIndex++;
            speakNextSentence();
          };
          
          this.synthesis?.speak(sentenceUtterance);
        } else if (onEnd) {
          onEnd();
        }
      };
      
      speakNextSentence();
    } else {
      // Speak the text as a single utterance if it's short
      this.synthesis?.speak(utterance);
    }
  }

  // Check if speech recognition is supported
  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  // Check if text-to-speech is supported
  isSynthesisSupported(): boolean {
    return this.synthesis !== null;
  }
}

// Export a singleton instance
export const speechService = new SpeechService(); 