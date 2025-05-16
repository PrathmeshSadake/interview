"use client";
import { useState, useEffect, useRef } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaSpinner,
  FaPause,
  FaCircle,
} from "react-icons/fa";
import { livekitService } from "../services/livekitService";
import { openaiService } from "../services/openaiService";
import { elevenLabsService } from "../services/elevenLabsService";
import { deepgramService } from "../services/deepgramService";
import Card from "./Card";
import UIButton from "./UIButton";

interface InterviewSessionProps {
  userInfo: {
    name: string;
    position: string;
    experience: string;
    additionalInfo: string;
    voiceId?: string;
  };
  onEndInterview: () => void;
}

export default function InterviewSession({
  userInfo,
  onEndInterview,
}: InterviewSessionProps) {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [botResponse, setBotResponse] = useState("");
  const [conversation, setConversation] = useState<
    { speaker: "user" | "bot"; text: string }[]
  >([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [usingLiveKitAgent, setUsingLiveKitAgent] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(""); // For ElevenLabs
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [autoListening, setAutoListening] = useState(true);
  const [lastProcessingTime, setLastProcessingTime] = useState(0);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Set active message index to latest message
  useEffect(() => {
    if (conversation.length > 0) {
      setActiveMessageIndex(conversation.length - 1);
    }
  }, [conversation.length]);

  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop =
        conversationContainerRef.current.scrollHeight;
    }
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, activeMessageIndex]);

  // Listen for transcript updates from deepgramService
  useEffect(() => {
    const handleTranscriptUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{
        transcript: string;
        isFinal: boolean;
      }>;
      setLiveTranscript(customEvent.detail.transcript);
      setUserSpeaking(true);

      if (customEvent.detail.isFinal) {
        setUserSpeaking(false);
      }
    };

    window.addEventListener("transcript-update", handleTranscriptUpdate);

    return () => {
      window.removeEventListener("transcript-update", handleTranscriptUpdate);
    };
  }, []);

  // Initialize services and start interview
  useEffect(() => {
    const initializeInterview = async () => {
      // Initialize services with API keys
      const livekitApiKey = process.env.NEXT_PUBLIC_LIVEKIT_API_KEY || "";
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

      // Check if LiveKit agent is properly configured
      const canUseLiveKitAgent = !!livekitApiKey && !!livekitUrl;
      setUsingLiveKitAgent(canUseLiveKitAgent);

      if (canUseLiveKitAgent) {
        livekitService.init({
          apiKey: livekitApiKey,
          livekitUrl: livekitUrl,
        });
      }

      // Initialize ElevenLabs
      const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || "";
      if (elevenLabsApiKey) {
        elevenLabsService.init(elevenLabsApiKey);
        // Get available voices from ElevenLabs
        try {
          const response = await fetch("/api/elevenlabs/voices");
          if (response.ok) {
            const data = await response.json();
            if (
              data.voices &&
              Array.isArray(data.voices) &&
              data.voices.length > 0
            ) {
              // Use user-selected voice if available
              const voiceToUse = userInfo.voiceId || data.voices[0].id;
              setSelectedVoice(voiceToUse);
              elevenLabsService.setVoice(voiceToUse);
            }
          }
        } catch (error) {
          console.error("Error fetching ElevenLabs voices:", error);
        }
      }

      // Initialize Deepgram
      const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "";
      if (deepgramApiKey) {
        deepgramService.init(deepgramApiKey);
        deepgramService.setSilenceThreshold(2500); // 2.5 seconds of silence to finish
      }

      // Initialize OpenAI with user information
      openaiService.resetConversation();
      openaiService.initializeWithUserInfo(userInfo);

      setIsLoading(true);

      try {
        if (canUseLiveKitAgent) {
          // Connect to LiveKit agent
          const agentConnected = await livekitService.connectToAgent(
            userInfo.name,
            handleAgentTranscript
          );

          setIsConnected(agentConnected);

          if (!agentConnected) {
            throw new Error("Failed to connect to LiveKit agent");
          }

          // The initial question will come from the agent
          // We'll wait a few seconds for it to initialize
          setTimeout(() => {
            setIsLoading(false);
          }, 3000);
        } else {
          // Fallback to OpenAI API for generating questions
          const initialQuestion = await openaiService.generateInitialQuestion();
          setBotResponse(initialQuestion);
          setConversation([{ speaker: "bot", text: initialQuestion }]);

          // Speak the initial question with ElevenLabs if available
          if (elevenLabsService && elevenLabsApiKey) {
            setIsBotSpeaking(true);
            elevenLabsService.speak(initialQuestion, () => {
              setIsBotSpeaking(false);
              // Auto-start listening after the bot finishes speaking
              if (autoListening && deepgramService.isSupported()) {
                startListening();
              }
            });
          } else {
            // If no voice synthesis, start listening immediately
            if (autoListening && deepgramService.isSupported()) {
              setTimeout(() => {
                startListening();
              }, 1000);
            }
          }

          setIsConnected(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing interview:", error);
        // Fallback initial question if something goes wrong
        const fallbackQuestion = `Hello ${userInfo.name}, thanks for joining this interview for the ${userInfo.position} position. Could you tell me about your background and experience?`;
        setBotResponse(fallbackQuestion);
        setConversation([{ speaker: "bot", text: fallbackQuestion }]);
        setIsConnected(true);
        setIsLoading(false);

        // Auto-start listening after a delay
        if (autoListening && deepgramService.isSupported()) {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      }
    };

    initializeInterview();

    // Cleanup on unmount
    return () => {
      if (deepgramService.isSupported()) {
        deepgramService.stopListening();
      }
      if (elevenLabsService) {
        elevenLabsService.stop();
      }
      livekitService.disconnect();
    };
  }, [userInfo, autoListening]);

  // Start listening for speech
  const startListening = () => {
    if (isBotSpeaking || isLoading || isListening) {
      return;
    }

    setLiveTranscript("");

    if (deepgramService.isSupported()) {
      const started = deepgramService.startListening(handleTranscript);
      setIsListening(started);
    } else {
      // Mock listening for browsers without speech recognition
      setIsListening(true);
      // Simulate receiving transcript after 3 seconds
      setTimeout(() => {
        const mockTranscript =
          "I have 5 years of experience working with React and Next.js. I've built several enterprise applications and led teams of frontend developers.";
        handleTranscript(mockTranscript);
      }, 3000);
    }
  };

  // Stop listening for speech
  const stopListening = () => {
    if (deepgramService.isSupported()) {
      deepgramService.stopListening();
    }
    setIsListening(false);
    setUserSpeaking(false);
  };

  // Handle transcript from speech recognition
  const handleTranscript = async (text: string) => {
    if (!text.trim()) return; // Ignore empty responses

    // Prevent processing same transcript multiple times or processing too quickly
    const now = Date.now();
    if (now - lastProcessingTime < 1000) {
      return;
    }
    setLastProcessingTime(now);

    // Add user response to conversation
    setConversation((prev) => [...prev, { speaker: "user", text }]);
    setLiveTranscript("");

    // Stop listening
    if (isListening) {
      stopListening();
    }

    // Show loading state while generating response
    setIsLoading(true);

    try {
      if (usingLiveKitAgent) {
        // With LiveKit agent, we send audio and get responses automatically
        // But for now, start the microphone to simulate this
        livekitService.startMicrophone();
      } else {
        // Fallback to using OpenAI API
        const nextQuestion = await openaiService.generateNextQuestion(text);
        setBotResponse(nextQuestion);
        setConversation((prev) => [
          ...prev,
          { speaker: "bot", text: nextQuestion },
        ]);

        // Speak the response with ElevenLabs
        if (elevenLabsService) {
          setIsBotSpeaking(true);
          elevenLabsService.speak(nextQuestion, () => {
            setIsBotSpeaking(false);
            // Auto-start listening again after bot finishes speaking
            if (autoListening && deepgramService.isSupported()) {
              setTimeout(() => {
                startListening();
              }, 500);
            }
          });
        } else if (autoListening && deepgramService.isSupported()) {
          // If no voice synthesis, start listening after a delay
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setIsBotSpeaking(false);
      // Auto-restart listening even if there was an error
      if (autoListening && deepgramService.isSupported()) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle transcript from LiveKit agent
  const handleAgentTranscript = (text: string) => {
    if (!text.trim()) return;

    // Add bot response to conversation
    setBotResponse(text);
    setConversation((prev) => [...prev, { speaker: "bot", text }]);

    // Speak the response with ElevenLabs
    if (elevenLabsService) {
      setIsBotSpeaking(true);
      elevenLabsService.speak(text, () => {
        setIsBotSpeaking(false);
        // Auto-start listening after bot finishes speaking
        if (autoListening && deepgramService.isSupported()) {
          setTimeout(() => {
            startListening();
          }, 500);
        }
      });
    } else if (autoListening && deepgramService.isSupported()) {
      // If no voice synthesis, start listening after a delay
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  };

  // Toggle listening state manually
  const toggleListening = () => {
    if (isBotSpeaking || isLoading) {
      return;
    }

    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  // Toggle auto-listening mode
  const toggleAutoListening = () => {
    setAutoListening(!autoListening);

    // If turning on auto-listening and not currently listening, start listening
    if (!autoListening && !isListening && !isBotSpeaking && !isLoading) {
      setTimeout(() => {
        startListening();
      }, 500);
    }
  };

  // Handle ending the interview
  const handleEndInterview = async () => {
    // Clean up resources
    if (deepgramService.isSupported()) {
      deepgramService.stopListening();
    }
    if (elevenLabsService) {
      elevenLabsService.stop();
    }
    await livekitService.disconnect();

    // Call the parent callback
    onEndInterview();
  };

  // Get current active message
  const activeMessage = conversation[activeMessageIndex] || null;

  // Calculate progress through conversation (for progress bar)
  const progressPercentage =
    conversation.length > 0
      ? Math.min(100, ((activeMessageIndex + 1) / conversation.length) * 100)
      : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl" variant="glassmorphic">
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center">
            Interview in Progress
            {isLoading && (
              <FaSpinner
                className="animate-spin ml-2 text-blue-400"
                size={16}
              />
            )}
            {isBotSpeaking && (
              <span className="ml-2 flex items-center text-xs px-2 py-0.5 bg-blue-900/40 rounded-full text-blue-300">
                <FaCircle className="animate-pulse mr-1" size={8} /> Bot
                speaking
              </span>
            )}
            {userSpeaking && !isBotSpeaking && (
              <span className="ml-2 flex items-center text-xs px-2 py-0.5 bg-green-900/40 rounded-full text-green-300">
                <FaCircle className="animate-pulse mr-1" size={8} /> Listening
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-400">Position: {userInfo.position}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleAutoListening}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              autoListening
                ? "bg-green-700/60 text-green-200 hover:bg-green-700/40"
                : "bg-gray-700/60 text-gray-300 hover:bg-gray-700/40"
            }`}
          >
            {autoListening ? "Auto Mode: On" : "Auto Mode: Off"}
          </button>
          <UIButton
            onClick={handleEndInterview}
            variant="secondary"
            className="py-1 px-3 text-sm"
          >
            End Interview
          </UIButton>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div
        className="h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 mb-5"
        ref={conversationContainerRef}
      >
        <div className="space-y-5 px-1">
          {/* Message history display */}
          {conversation.map((message, index) => (
            <div
              key={index}
              ref={
                index === activeMessageIndex ? messageContainerRef : undefined
              }
              className={`p-4 rounded-lg transition-all duration-300 ${
                index === activeMessageIndex
                  ? "scale-100 opacity-100"
                  : "scale-95 opacity-80"
              } ${
                message.speaker === "bot"
                  ? "bg-gray-800/70 border-l-2 border-blue-500 shadow-lg shadow-blue-900/10"
                  : "bg-blue-600/20 border-l-2 border-green-400 shadow-lg shadow-green-900/10"
              }`}
            >
              <p
                className={`text-sm font-medium mb-2 flex items-center ${
                  message.speaker === "bot" ? "text-blue-400" : "text-green-400"
                }`}
              >
                {message.speaker === "bot" ? <>Interviewer</> : <>You</>}
                {index === conversation.length - 1 &&
                  userSpeaking &&
                  message.speaker === "user" && (
                    <span className="ml-2 inline-flex items-center">
                      <FaCircle className="animate-pulse mr-1" size={8} />
                    </span>
                  )}
              </p>
              <p className="text-gray-200 text-lg leading-relaxed">
                {message.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Live transcript display */}
      {liveTranscript && isListening && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-900/20 border border-green-800/30 flex-grow">
          <p className="text-sm font-medium mb-1 text-green-400 flex items-center">
            <FaCircle className="animate-pulse mr-2" size={8} />
            Live Transcript
          </p>
          <p className="text-gray-300">{liveTranscript}</p>
        </div>
      )}

      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-800/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleListening}
            disabled={isBotSpeaking || isLoading}
            className={`p-4 rounded-full transition-all duration-300 ${
              isListening
                ? "bg-red-500 text-white shadow-lg scale-110 hover:bg-red-600"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
            } ${
              isBotSpeaking || isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg shadow-md"
            }`}
          >
            {isListening ? (
              <FaMicrophoneSlash size={24} />
            ) : (
              <FaMicrophone size={24} />
            )}
          </button>

          <div className="flex-grow">
            <div className="relative">
              <div
                className={`py-3 px-4 rounded-lg bg-gray-800/50 border border-gray-700/80 text-gray-300 transition-all duration-300 ${
                  isListening ? "border-red-500/50 shadow-inner" : ""
                }`}
              >
                {isListening ? (
                  <div className="flex items-center">
                    <span className="mr-2">Listening...</span>
                    <div className="flex space-x-1">
                      <div
                        className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                      <div
                        className="w-1.5 h-6 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "600ms" }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <span>
                    {isBotSpeaking
                      ? "Bot is speaking..."
                      : isLoading
                      ? "Processing your response..."
                      : autoListening
                      ? "Automatic mode active - just speak when ready"
                      : "Click the microphone to speak"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
