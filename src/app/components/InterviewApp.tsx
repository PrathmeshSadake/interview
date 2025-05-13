"use client"
import InterviewForm from './InterviewForm';
import InterviewSession from './InterviewSession';
import { useState } from 'react';
import { openaiService } from '../services/openaiService';
import { FaSpinner } from 'react-icons/fa';

interface UserInfo {
  name: string;
  position: string;
  experience: string;
  additionalInfo: string;
}

export default function InterviewApp() {
  const [interviewStage, setInterviewStage] = useState<'form' | 'interview' | 'completed' | 'summarizing'>('form');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [interviewSummary, setInterviewSummary] = useState<string>('');

  const handleFormSubmit = (formData: UserInfo) => {
    setUserInfo(formData);
    setInterviewStage('interview');
  };

  const handleEndInterview = async () => {
    // Show summarizing state
    setInterviewStage('summarizing');
    
    try {
      // Generate a summary of the interview using OpenAI
      const summary = await openaiService.generateSummary();
      setInterviewSummary(summary);
    } catch (error) {
      console.error("Error generating interview summary:", error);
      // Fallback summary if API call fails
      setInterviewSummary(`Thank you for completing the interview, ${userInfo?.name}! 
      We've recorded your responses and will get back to you shortly regarding the ${userInfo?.position} position.`);
    }
    
    // Show completed state
    setInterviewStage('completed');
  };

  const startNewInterview = () => {
    setUserInfo(null);
    setInterviewSummary('');
    setInterviewStage('form');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      {interviewStage === 'form' && (
        <InterviewForm onSubmit={handleFormSubmit} />
      )}

      {interviewStage === 'interview' && userInfo && (
        <InterviewSession 
          userInfo={userInfo} 
          onEndInterview={handleEndInterview} 
        />
      )}
      
      {interviewStage === 'summarizing' && (
        <div className="max-w-md w-full mx-auto bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
          <FaSpinner className="animate-spin text-blue-600 text-2xl mb-4" />
          <h2 className="text-xl font-semibold mb-2">Analyzing Interview</h2>
          <p className="text-gray-600">
            Please wait while we generate a summary of your interview...
          </p>
        </div>
      )}

      {interviewStage === 'completed' && (
        <div className="max-w-md w-full mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Interview Completed</h2>
          <div className="mb-6 text-gray-700 whitespace-pre-line">{interviewSummary}</div>
          <button
            onClick={startNewInterview}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start New Interview
          </button>
        </div>
      )}
    </div>
  );
} 