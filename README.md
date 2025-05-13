# AI-Powered Voice-to-Voice Interview System

This project provides an AI-driven interview platform that uses voice technology to create a dynamic, conversational interview experience. The system uses LiveKit for real-time voice communication and OpenAI for generating intelligent interview questions based on user responses.

## Features

- **User Information Collection**: Collects basic information such as name, position, and experience before the interview.
- **Voice-Based Interview**: Conducts the entire interview through voice interaction using the Web Speech API.
- **Dynamic Question Generation**: Uses OpenAI to generate context-aware follow-up questions based on previous responses.
- **Real-Time Voice Communication**: Integrates with LiveKit for high-quality, low-latency voice interaction.
- **Text-to-Speech**: Converts AI-generated questions into spoken voice.
- **Speech-to-Text**: Converts user voice responses into text for processing.
- **Interview Summary**: Provides a summary of the interview after completion.

## Dynamic Interview Experience

The interview system creates a natural, conversational experience by:

1. Starting with an introductory question tailored to the position
2. Analyzing the candidate's responses to generate relevant follow-up questions
3. Asking for clarification or examples when needed
4. Adapting the interview flow based on the candidate's answers
5. Creating a personalized interview summary highlighting strengths and areas for improvement

The AI interviewer is designed to probe deeper into technical skills, ask about problem-solving approaches, and explore behavioral scenarios based on the context of the conversation.

## Tech Stack

- **Next.js**: React framework for building the web application
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling the UI
- **LiveKit**: For real-time voice communication
- **OpenAI API**: For generating dynamic interview questions
- **Web Speech API**: For speech recognition and text-to-speech functionality

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd interview-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following environment variables:
   ```
   # Required for OpenAI API
   OPENAI_API_KEY=your_openai_api_key

   # Required for LiveKit integration (optional for demo)
   NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app/components`: React components for the interview UI
- `/src/app/services`: Service files for LiveKit, OpenAI, and speech handling
- `/src/app/types`: TypeScript type definitions
- `/src/app/api`: Server-side API routes for secure integration with external services

## Key Components

- **InterviewForm**: Collects user information before starting the interview
- **InterviewSession**: Handles the real-time voice interview
- **InterviewApp**: Main component that orchestrates the interview flow
- **OpenAI Service**: Handles generation of dynamic interview questions and summaries
- **Speech Service**: Manages speech recognition and text-to-speech functionality

## Notes

- The current implementation includes fallback mechanisms when APIs are unavailable:
  1. If OpenAI API is not configured, the system will use predefined questions
  2. If Web Speech API is not supported by the browser, it will simulate voice interaction

- For production deployment, make sure to:
  1. Configure a proper OpenAI API key with sufficient rate limits
  2. Set up a LiveKit server for production use
  3. Implement proper token generation for LiveKit

## License

MIT
