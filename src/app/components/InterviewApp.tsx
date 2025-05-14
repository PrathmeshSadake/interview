"use client";
import InterviewForm from "./InterviewForm";
import InterviewSession from "./InterviewSession";
import { useState, useEffect } from "react";
import { openaiService } from "../services/openaiService";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import Card from "./Card";
import UIButton from "./UIButton";

interface UserInfo {
  name: string;
  position: string;
  experience: string;
  additionalInfo: string;
  voiceId?: string;
}

export default function InterviewApp() {
  const [interviewStage, setInterviewStage] = useState<
    "form" | "interview" | "completed" | "summarizing"
  >("form");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [interviewSummary, setInterviewSummary] = useState<string>("");
  const [animationState, setAnimationState] = useState("initial");
  const [mockUserInfo, setMockUserInfo] = useState<UserInfo>({
    name: "",
    position: "",
    experience: "",
    additionalInfo: "",
    voiceId: "",
  });

  // Initialize with mock data for preview
  useEffect(() => {
    if (interviewStage === "form") {
      setMockUserInfo({
        name: "Preview Mode",
        position: "Sample Position",
        experience: "Sample Experience",
        additionalInfo: "This is a preview of the interview flow.",
        voiceId: "",
      });
    }
  }, [interviewStage]);

  // Handle animation states when stage changes
  useEffect(() => {
    if (interviewStage === "form") {
      setAnimationState("form-active");
    } else if (interviewStage === "interview") {
      // First start with form minimization animation
      setAnimationState("minimizing-form");

      // After a short delay, show the conversation
      const timer = setTimeout(() => {
        setAnimationState("interview-active");
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setAnimationState("transition-out");

      // After animation completes, clean up
      const timer = setTimeout(() => {
        setAnimationState("summary-stage");
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [interviewStage]);

  const handleFormSubmit = (formData: UserInfo) => {
    setUserInfo(formData);
    setInterviewStage("interview");
  };

  const handleEndInterview = async () => {
    // Show summarizing state
    setInterviewStage("summarizing");

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
    setInterviewStage("completed");
  };

  const startNewInterview = () => {
    setUserInfo(null);
    setInterviewSummary("");
    setInterviewStage("form");
  };

  // Show all sections at all times but with different sizes
  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full px-4">
      <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto gap-8 justify-center items-start">
        {/* Form container - always visible but size changes based on stage */}
        <div
          className={`transition-all duration-500 ${
            interviewStage === "form"
              ? "w-full lg:w-3/4 form-enter"
              : "lg:w-1/3 form-minimized"
          }`}
        >
          <InterviewForm
            onSubmit={handleFormSubmit}
            isMinimized={interviewStage !== "form"}
            userInfo={userInfo || mockUserInfo}
          />
        </div>

        {/* Conversation container - always visible but size/opacity changes */}
        <div
          className={`transition-all duration-500 ${
            interviewStage === "interview"
              ? "lg:w-2/3 opacity-100 conversation-active"
              : "lg:w-1/4 opacity-60 hover:opacity-80"
          }`}
        >
          {interviewStage === "interview" ? (
            <InterviewSession
              userInfo={userInfo!}
              onEndInterview={handleEndInterview}
            />
          ) : (
            // Preview/placeholder for conversation
            <Card className="w-full" variant="glassmorphic">
              <div className="border-b border-gray-800 pb-3 mb-3">
                <h3 className="text-white font-medium">Interview Preview</h3>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/70 border-l-2 border-blue-500 mb-4">
                <p className="text-sm font-medium mb-2 text-gray-400">
                  Interviewer
                </p>
                <p className="text-gray-300">
                  Example questions will appear here during the interview.
                </p>
              </div>
              {interviewStage === "form" && (
                <p className="text-gray-400 text-sm">
                  Fill out the form to begin your interview.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Summary containers - show/hide based on stage */}
      {interviewStage === "summarizing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
          <div
            className={`stage-transition ${
              animationState === "transition-out"
                ? "stage-enter"
                : "stage-active"
            }`}
          >
            <Card
              className="w-full max-w-md mx-auto text-center py-8"
              variant="glassmorphic"
            >
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <FaSpinner className="animate-spin text-blue-500 text-4xl" />
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl"></div>
                </div>
                <h2 className="text-xl font-semibold mb-3 text-white">
                  Analyzing Interview
                </h2>
                <p className="text-gray-400 max-w-sm mx-auto">
                  Please wait while we generate a comprehensive summary of your
                  interview responses...
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {interviewStage === "completed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10">
          <div
            className={`stage-transition ${
              animationState === "transition-out"
                ? "stage-enter"
                : "stage-active"
            }`}
          >
            <Card className="w-full max-w-xl mx-auto" variant="glassmorphic">
              <div className="flex items-center mb-5 pb-3 border-b border-gray-800">
                <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Interview Completed
                  </h2>
                  <p className="text-sm text-gray-400">
                    Thank you for participating, {userInfo?.name}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-gray-300 text-lg mb-3 font-medium">
                  Interview Summary
                </h3>
                <div className="rounded-lg bg-gray-800/50 p-5 border border-gray-700/50 text-gray-300 whitespace-pre-line">
                  {interviewSummary}
                </div>
              </div>

              <div className="flex justify-end">
                <UIButton onClick={startNewInterview} className="px-8">
                  Start New Interview
                </UIButton>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
