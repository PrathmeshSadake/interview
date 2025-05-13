"use client";
import InterviewApp from './components/InterviewApp';

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col px-4 py-8 sm:px-6 sm:py-12 overflow-hidden">
      <header className="w-full max-w-5xl mx-auto mb-8 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
          AI Interview Bot
        </h1>
        <p className="text-gray-400 text-lg">
          Experience a dynamic, voice-driven interview powered by artificial intelligence
        </p>
      </header>
      
      <main className="w-full flex-grow flex items-center justify-center">
        <InterviewApp />
      </main>
      
      <footer className="mt-8 text-center text-gray-500 text-sm pb-4">
        <p>powered by <span className="font-semibold">buildfastwithai</span></p>
      </footer>
    </div>
  );
}
