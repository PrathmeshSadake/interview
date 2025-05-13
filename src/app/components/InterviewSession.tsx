import { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaSpinner } from 'react-icons/fa';
import { livekitService } from '../services/livekitService';
import { openaiService } from '../services/openaiService';
import { speechService } from '../services/speechService';

interface InterviewSessionProps {
  userInfo: {
    name: string;
    position: string;
    experience: string;
    additionalInfo: string;
  };
  onEndInterview: () => void;
}

export default function InterviewSession({ userInfo, onEndInterview }: InterviewSessionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [conversation, setConversation] = useState<{ speaker: 'user' | 'bot', text: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const conversationContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationContainerRef.current) {
      conversationContainerRef.current.scrollTop = conversationContainerRef.current.scrollHeight;
    }
  }, [conversation]);
  
  // Initialize services and start interview
  useEffect(() => {
    const initializeInterview = async () => {
      // Initialize OpenAI with user information
      openaiService.resetConversation();
      openaiService.initializeWithUserInfo(userInfo);
      
      setIsLoading(true);
      
      try {
        // Generate initial question
        const initialQuestion = await openaiService.generateInitialQuestion();
        setBotResponse(initialQuestion);
        setConversation([{ speaker: 'bot', text: initialQuestion }]);
        
        // Speak the initial question
        if (speechService.isSynthesisSupported()) {
          setIsBotSpeaking(true);
          speechService.speak(initialQuestion, () => {
            setIsBotSpeaking(false);
          });
        }
      } catch (error) {
        console.error("Error initializing interview:", error);
        // Fallback initial question if something goes wrong
        const fallbackQuestion = `Hello ${userInfo.name}, thanks for joining this interview for the ${userInfo.position} position. Could you tell me about your background and experience?`;
        setBotResponse(fallbackQuestion);
        setConversation([{ speaker: 'bot', text: fallbackQuestion }]);
      } finally {
        setIsLoading(false);
      }
      
      // Connect to LiveKit (in a real implementation)
      // const connected = await livekitService.connect(userInfo.name, handleRemoteAudio);
      // setIsConnected(connected);
      
      // For demo purposes, we'll simulate being connected
      setIsConnected(true);
    };
    
    initializeInterview();
    
    // Cleanup on unmount
    return () => {
      speechService.stopListening();
      if (speechService.isSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
      // livekitService.disconnect();
    };
  }, [userInfo]);
  
  // Handle transcript from speech recognition
  const handleTranscript = async (text: string) => {
    if (!text.trim()) return; // Ignore empty responses
    
    setTranscript(text);
    
    // Add user response to conversation
    setConversation(prev => [...prev, { speaker: 'user', text }]);
    
    // Stop listening and process response
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    }
    
    // Show loading state while generating response
    setIsLoading(true);
    
    try {
      // Generate bot follow-up
      const nextQuestion = await openaiService.generateNextQuestion(text);
      setBotResponse(nextQuestion);
      setConversation(prev => [...prev, { speaker: 'bot', text: nextQuestion }]);
      
      // Speak the response
      if (speechService.isSynthesisSupported()) {
        setIsBotSpeaking(true);
        speechService.speak(nextQuestion, () => {
          setIsBotSpeaking(false);
        });
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock function for handling remote audio from LiveKit
  const handleRemoteAudio = (text: string) => {
    // In a real implementation, this would process audio from the bot
    console.log('Received remote audio transcript:', text);
  };
  
  // Toggle listening state
  const toggleListening = () => {
    if (isBotSpeaking || isLoading) {
      // Don't start listening if the bot is still speaking or loading
      return;
    }
    
    if (!isListening) {
      // Start listening
      if (speechService.isRecognitionSupported()) {
        const started = speechService.startListening(handleTranscript);
        setIsListening(started);
      } else {
        // Mock listening for browsers without speech recognition
        setIsListening(true);
        // Simulate receiving transcript after 3 seconds
        setTimeout(() => {
          const mockTranscript = "I have 5 years of experience working with React and Next.js. I've built several enterprise applications and led teams of frontend developers.";
          handleTranscript(mockTranscript);
        }, 3000);
      }
    } else {
      // Stop listening
      if (speechService.isRecognitionSupported()) {
        speechService.stopListening();
      }
      setIsListening(false);
    }
  };
  
  // Handle ending the interview
  const handleEndInterview = async () => {
    // Clean up resources
    speechService.stopListening();
    if (speechService.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    // await livekitService.disconnect();
    
    // Call the parent callback
    onEndInterview();
  };
  
  return (
    <div className="max-w-2xl w-full mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-xl font-semibold">Interview in Progress</h2>
        <p className="text-sm opacity-80">Position: {userInfo.position}</p>
      </div>
      
      <div 
        ref={conversationContainerRef}
        className="h-96 p-4 overflow-y-auto bg-gray-50"
      >
        {conversation.map((entry, index) => (
          <div 
            key={index} 
            className={`mb-3 p-3 rounded-lg ${
              entry.speaker === 'bot' 
                ? 'bg-blue-100 mr-12' 
                : 'bg-gray-200 ml-12'
            }`}
          >
            <p className="text-sm font-semibold mb-1">
              {entry.speaker === 'bot' ? 'Interviewer' : 'You'}
            </p>
            <p>{entry.text}</p>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <FaSpinner className="animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Generating response...</span>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleListening}
            disabled={isBotSpeaking || isLoading}
            className={`p-3 rounded-full ${
              isListening 
                ? 'bg-red-500 text-white' 
                : isBotSpeaking || isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white'
            }`}
          >
            {isListening ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </button>
          
          <div className="flex-1 p-2 rounded-md bg-gray-100">
            {isBotSpeaking ? (
              <p className="text-gray-500">Interviewer is speaking...</p>
            ) : isLoading ? (
              <p className="text-gray-500">Processing your response...</p>
            ) : isListening ? (
              <p className="text-gray-500">Listening...</p>
            ) : (
              <p className="text-gray-500">
                {transcript ? transcript : "Click the microphone to speak"}
              </p>
            )}
          </div>
          
          <button
            onClick={handleEndInterview}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            End Interview
          </button>
        </div>
      </div>
    </div>
  );
} 