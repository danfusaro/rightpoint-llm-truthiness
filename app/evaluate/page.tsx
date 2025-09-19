'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EvaluatePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    if (!source.trim()) {
      setError('Please provide an authoritative source');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, source }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit evaluation');
      }
      
      const data = await response.json();
      
      // Navigate to results page with the evaluation ID
      router.push(`/results/${data.evaluationId}`);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while submitting your evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Evaluate LLM Truthiness</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            Question
          </label>
          <textarea
            id="question"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question for the LLM..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-sm text-gray-500 mt-1">
            Ask a specific question that can be verified against your source.
          </p>
        </div>
        
        <div>
          <label htmlFor="source" className="block text-sm font-medium mb-2">
            Authoritative Source
          </label>
          <textarea
            id="source"
            rows={8}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Enter the authoritative source text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-sm text-gray-500 mt-1">
            Provide the authoritative source text that contains factual information related to your question.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}
