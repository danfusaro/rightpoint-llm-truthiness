import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 py-24 bg-gray-50">
      <div className="text-center max-w-3xl w-full">
        <h1 className="text-5xl font-extrabold mb-4">LLM Truthiness Evaluator</h1>
        <p className="text-lg text-gray-700 mb-10">
          Evaluate how truthful LLM responses are compared to authoritative sources.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/evaluate"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Start Evaluation
          </Link>

          <Link
            href="/evaluations"
            className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            View History
          </Link>
        </div>
      </div>
    </main>
  );
}