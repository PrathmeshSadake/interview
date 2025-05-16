"use client";
import InterviewApp from './components/InterviewApp';

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col px-4 py-8 sm:px-6 sm:py-12 overflow-hidden relative">
      {/* Background gradient animation */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_40%_30%,rgba(59,130,246,0.08),transparent_60%)]"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.08),transparent_60%)]"></div>

      <header className="w-full max-w-5xl mx-auto mb-8 sm:mb-12 text-center relative">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 glow-text">
          <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 text-transparent bg-clip-text">
            AI Interview Bot
          </span>
        </h1>
        <div className="h-0.5 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mb-4 rounded-full"></div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Experience a dynamic, voice-driven interview powered by artificial intelligence
        </p>
        
        {/* Tech badges */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 border border-blue-800/20">LiveKit</span>
          <span className="px-3 py-1 rounded-full bg-green-900/20 text-green-400 border border-green-800/20">OpenAI</span>
          <span className="px-3 py-1 rounded-full bg-purple-900/20 text-purple-400 border border-purple-800/20">ElevenLabs</span>
          <span className="px-3 py-1 rounded-full bg-gray-800/40 text-gray-400 border border-gray-700/20">Deepgram</span>
        </div>
      </header>
      
      <main className="w-full flex-grow flex items-center justify-center">
        <InterviewApp />
      </main>
      
      <footer className="mt-8 text-center text-gray-500 text-sm pb-4">
        <p className="flex items-center justify-center gap-1">
          powered by <span className="font-semibold">buildfastwithai</span>
        </p>
      </footer>
    </div>
  );
}
