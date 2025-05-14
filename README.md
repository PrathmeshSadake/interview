# AI Interview Bot with LiveKit, OpenAI, and ElevenLabs

This project creates an AI-powered interview bot that can conduct real-time voice conversations using:

- **LiveKit Agents** for handling real-time audio processing
- **OpenAI** for chat generation and language modeling
- **ElevenLabs** for high-quality voice synthesis
- **Deepgram** for accurate speech-to-text transcription

## Features

- Real-time conversation with natural voice interactions
- Interview question generation based on job position and experience
- Real-time speech transcription using Deepgram
- High-quality voice synthesis with ElevenLabs
- Option to select different ElevenLabs voices
- Interview summary generation

## Prerequisites

- Node.js (v18 or later)
- LiveKit Cloud account or self-hosted LiveKit server
- OpenAI API key
- ElevenLabs API key
- Deepgram API key

## Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_LIVEKIT_URL=your-livekit-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
NEXT_PUBLIC_DEEPGRAM_API_KEY=your-deepgram-api-key
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Using LiveKit Agents

This project supports LiveKit Agents for a complete voice assistant experience. To use LiveKit Agents:

1. Set up a LiveKit Cloud account at [livekit.io](https://livekit.io)
2. Install the LiveKit CLI: `npm install -g livekit-cli`
3. Authenticate with LiveKit Cloud: `lk cloud auth`
4. Create a voice agent using the template:

```bash
lk app create --template voice-pipeline-agent-python
```

5. Configure your agent with your API keys when prompted
6. Start your agent:

```bash
cd <agent_dir>
python3 -m venv venv
source venv/bin/activate
python3 -m pip install -r requirements.txt
python3 agent.py dev
```

7. Update your `.env.local` file with the LiveKit URL, API key, and secret

## Customizing the Agent

You can customize the agent behavior by editing the `agent.py` file in your LiveKit agent project. For example, to use a different LLM model or TTS provider, modify the assistant initialization:

```python
assistant = VoiceAssistant(
    vad=silero.VAD.load(),
    stt=deepgram.STT(),
    llm=openai.LLM(model="gpt-4o"),
    tts=cartesia.TTS(),
    chat_ctx=initial_ctx,
)
```

## Fallback Behavior

If LiveKit Agents is not configured, the application will fall back to using:

- Browser's Web Speech API for speech recognition or Deepgram if configured
- OpenAI for generating responses
- ElevenLabs for text-to-speech if configured

## License

MIT
