import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-6 text-center">LLM Truthiness Evaluator</h1>
        <p className="text-center mb-8">
          Evaluate how truthful LLM responses are compared to authoritative sources
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link 
            href="/evaluate" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-200"
          >
            Start Evaluation
          </Link>
          <Link 
            href="/evaluations" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg text-lg transition duration-200"
          >
            View History
          </Link>
        </div>
      </div>
    </main>
  );
}
