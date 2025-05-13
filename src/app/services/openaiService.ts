// This service handles OpenAI integration for generating interview questions
class OpenAIService {
  private conversationHistory: { role: 'system' | 'user' | 'assistant', content: string }[] = [];

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
        Your goal is to ask relevant, insightful questions that adapt based on the candidate's responses.
        Keep your responses concise and focused on asking the next question.
        Create a natural conversation flow by referring to previous answers when relevant.
        Ask follow-up questions when you notice interesting details or gaps in the candidate's responses.
        Ask for specific examples when candidates make general statements.
        Probe deeper into technical skills relevant to the position they're applying for.
        Explore their problem-solving approach through situational questions.
        Vary your questions between technical skills, behavioral scenarios, and experience.
        Avoid making statements about the quality of answers - your job is only to ask questions.
        Do not repeat questions that have already been asked or answered.`
      }
    ];
  }

  // Add user information to the conversation context
  initializeWithUserInfo(userInfo: { name: string; position: string; experience: string; additionalInfo: string }) {
    this.conversationHistory.push({
      role: 'system',
      content: `You are interviewing ${userInfo.name} for a ${userInfo.position} position. 
      They have ${userInfo.experience} of experience.
      Additional information about the candidate: ${userInfo.additionalInfo}
      
      Begin with a general introductory question that allows them to talk about themselves in relation to the ${userInfo.position} role. 
      Do not start with "Tell me about yourself" - be more specific and creative with your opening question.`
    });
  }

  // Generate an initial interview question
  async generateInitialQuestion(): Promise<string> {
    try {
      return this.callOpenAI("Generate an initial interview question to start the interview.");
    } catch (error) {
      console.error("Error generating initial question:", error);
      // Fallback response if API call fails
      return "Could you start by telling me about your background and how it relates to this position?";
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
      return this.callOpenAI("Based on the candidate's response, ask a relevant follow-up question.");
    } catch (error) {
      console.error("Error generating next question:", error);
      // Fallback response if API call fails
      return "That's interesting. Could you elaborate more on that?";
    }
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
    
    // Dynamic fallback responses
    const fallbackResponses = [
      "Could you tell me about your experience and how it relates to this position?",
      "That's interesting. Can you share a specific challenge you faced in your previous role and how you overcame it?",
      "How do you approach problem-solving when faced with ambiguous requirements?",
      "Could you describe a situation where you had to adapt quickly to changing priorities?",
      "What aspects of this role are you most excited about, and why?",
      "How do you stay current with industry trends and developments?"
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