"use client";
import { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaSpinner } from "react-icons/fa";
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
  };
  onEndInterview: () => void;
}

export default function InterviewSession({
  userInfo,
  onEndInterview,
}: InterviewSessionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
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
  const conversationContainerRef = useRef<HTMLDivElement>(null);

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
  }, [conversation]);

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
          const voices = await fetch("/api/elevenlabs/voices").then((res) =>
            res.json()
          );
          if (voices && voices.length > 0) {
            setSelectedVoice(voices[0].id); // Use the first voice by default
            elevenLabsService.setVoice(voices[0].id);
          }
        } catch (error) {
          console.error("Error fetching ElevenLabs voices:", error);
        }
      }

      // Initialize Deepgram
      const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "";
      if (deepgramApiKey) {
        deepgramService.init(deepgramApiKey);
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
            });
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
  }, [userInfo]);

  // Handle transcript from speech recognition
  const handleTranscript = async (text: string) => {
    if (!text.trim()) return; // Ignore empty responses

    setTranscript(text);

    // Add user response to conversation
    setConversation((prev) => [...prev, { speaker: "user", text }]);

    // Stop listening
    if (isListening) {
      if (deepgramService.isSupported()) {
        deepgramService.stopListening();
      }
      setIsListening(false);
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
          });
        }
      }
    } catch (error) {
      console.error("Error generating response:", error);
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
      });
    }
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isBotSpeaking || isLoading) {
      // Don't start listening if the bot is still speaking or loading
      return;
    }

    if (!isListening) {
      // Start listening
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
    } else {
      // Stop listening
      if (deepgramService.isSupported()) {
        deepgramService.stopListening();
      }
      setIsListening(false);
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

  return (
    <Card className="w-full max-w-2xl mx-auto" variant="glassmorphic">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Interview in Progress
          </h2>
          <p className="text-sm text-gray-400">Position: {userInfo.position}</p>
        </div>
        <UIButton onClick={handleEndInterview} variant="secondary">
          End Interview
        </UIButton>
      </div>

      <div className="space-y-4 mb-5">
        {/* Current active message display */}
        {activeMessage && (
          <div
            className={`p-4 rounded-lg ${
              activeMessage.speaker === "bot"
                ? "bg-gray-800/70 border-l-2 border-blue-500"
                : "bg-blue-600/20 border-l-2 border-green-400"
            }`}
          >
            <p className="text-sm font-medium mb-2 text-gray-400">
              {activeMessage.speaker === "bot" ? "Interviewer" : "You"}
            </p>
            <p className="text-gray-200 text-lg">{activeMessage.text}</p>
          </div>
        )}

        {/* Conversation history indicator pills */}
        {conversation.length > 1 && (
          <div className="flex justify-center space-x-1 pt-2">
            {conversation.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === activeMessageIndex
                    ? "w-4 bg-blue-500"
                    : "w-2 bg-gray-700"
                }`}
                onClick={() => setActiveMessageIndex(index)}
                aria-label={`View message ${index + 1}`}
              />
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-3">
            <FaSpinner className="animate-spin text-blue-500 mr-2" />
            <span className="text-gray-400">Generating response...</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-800/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleListening}
            disabled={isBotSpeaking || isLoading}
            className={`p-4 rounded-full transition-all duration-200 ${
              isListening
                ? "bg-red-500 text-white shadow-lg"
                : "bg-blue-600 text-white"
            } ${
              isBotSpeaking || isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg"
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
                className={`py-3 px-4 rounded-lg bg-gray-800/50 border border-gray-700/80 text-gray-300 ${
                  isListening ? "border-red-500/50" : ""
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
