// This service handles OpenAI integration for generating interview questions
class OpenAIService {
  private conversationHistory: { role: 'system' | 'user' | 'assistant', content: string }[] = [];
  private crossQuestionCount: number = 0;
  private maxCrossQuestions: number = 2;

  constructor() {
    // Initialize the conversation with a system message
    this.resetConversation();
  }

  // Reset conversation to initial state
  resetConversation() {
    this.conversationHistory = [
      {
        role: 'system',
        content: `You are an AI interviewer conducting a job interview. 
        Your goal is to ask relevant, concise questions that adapt based on the candidate's responses.
        IMPORTANT: Keep questions very brief and to the point. Questions should be 1-2 sentences maximum.
        Create a natural conversation flow but move to new topics after 1-2 follow-up questions maximum.
        Ask follow-up questions only when absolutely necessary for clarification.
        Limit follow-up questions to 1-2 per topic before moving to a new topic.
        Avoid complex, multi-part questions - focus on one specific aspect at a time.
        Vary your questions between technical skills, behavioral scenarios, and experience.
        Avoid making statements about the quality of answers - your job is only to ask questions.
        Do not repeat questions that have already been asked or answered.`
      }
    ];
    this.crossQuestionCount = 0;
  }

  // Add user information to the conversation context
  initializeWithUserInfo(userInfo: { name: string; position: string; experience: string; additionalInfo: string }) {
    this.conversationHistory.push({
      role: 'system',
      content: `You are interviewing ${userInfo.name} for a ${userInfo.position} position. 
      They have ${userInfo.experience} of experience.
      Additional information about the candidate: ${userInfo.additionalInfo}
      
      Begin with a general introductory question that allows them to talk about themselves in relation to the ${userInfo.position} role. 
      Do start like "Tell me about yourself" - be more specific and creative with your opening question. and Keep your questions short and specific.`
    });
  }

  // Generate an initial interview question
  async generateInitialQuestion(): Promise<string> {
    try {
      return this.callOpenAI("Generate a brief, direct initial interview question (1-2 sentences maximum).");
    } catch (error) {
      console.error("Error generating initial question:", error);
      // Fallback response if API call fails
      return "What skills make you a good fit for this position?";
    }
  }

  // Process user response and generate next question
  async generateNextQuestion(userResponse: string): Promise<string> {
    // Add user response to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userResponse
    });
    
    try {
      // Check if we should ask a follow-up or move to a new topic
      if (this.shouldAskFollowUp(userResponse)) {
        this.crossQuestionCount++;
        return this.callOpenAI("Ask a very brief follow-up question (1 sentence only) directly related to their last response.");
      } else {
        // Reset cross-question counter when moving to a new topic
        this.crossQuestionCount = 0;
        return this.callOpenAI("Ask a brief question (1-2 sentences) on a new topic relevant to the position.");
      }
    } catch (error) {
      console.error("Error generating next question:", error);
      // Fallback response if API call fails
      return "Tell me about a project you worked on recently.";
    }
  }

  // Determine if we should ask a follow-up question or move to a new topic
  private shouldAskFollowUp(userResponse: string): boolean {
    // If we've already asked the maximum number of cross-questions, move on
    if (this.crossQuestionCount >= this.maxCrossQuestions) {
      return false;
    }
    
    // Simple heuristic: short responses might need follow-up
    // In a real implementation, this would be more sophisticated
    const needsFollowUp = userResponse.split(' ').length < 20 || 
                          userResponse.includes('?') ||
                          Math.random() < 0.3; // Occasionally ask follow-up
    
    return needsFollowUp;
  }

  // Generate interview summary
  async generateSummary(): Promise<string> {
    try {
      return this.callOpenAI("Provide a brief summary of this interview, highlighting the candidate's strengths and potential areas for improvement.");
    } catch (error) {
      console.error("Error generating summary:", error);
      // Fallback summary if API call fails
      return "Thank you for participating in this interview. Your responses have been recorded for review.";
    }
  }

  // Call OpenAI API through our server-side API route
  private async callOpenAI(systemPrompt?: string): Promise<string> {
    // Add the system prompt to the conversation if provided
    if (systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt
      });
    }

    try {
      // Call our own API endpoint instead of OpenAI directly
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response.choices[0].message.content.trim();

      // Add the AI response to the conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });

      return aiResponse;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return this.generateMockResponse();
    }
  }

  // Generate mock responses as fallback
  private generateMockResponse(): string {
    // Count how many turns have happened in the conversation
    const userResponseCount = this.conversationHistory.filter(msg => msg.role === 'user').length;
    
    // Dynamic fallback responses - shorter and more direct
    const fallbackResponses = [
      "Tell me about yourself",
      "Describe your experience with this technology.",
      "What was your biggest challenge in your last role?",
      "How do you approach difficult problems?",
      "Tell me about a time you had to adapt quickly.",
      "What interests you most about this role?",
      "How do you stay updated with industry trends?"
    ];
    
    // Select a response based on the conversation turn, or the last one if we've exhausted the list
    const index = Math.min(userResponseCount, fallbackResponses.length - 1);
    const response = fallbackResponses[index];
    
    // Add the response to the conversation history
    this.conversationHistory.push({
      role: 'assistant',
      content: response
    });
    
    return response;
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService(); 