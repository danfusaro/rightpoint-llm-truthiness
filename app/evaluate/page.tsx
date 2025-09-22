'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TruthinessExplanation, { TruthinessWeights } from '@/components/TruthinessExplanation';

export default function EvaluatePage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [url, setUrl] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [captureDate, setCaptureDate] = useState<string | null>(null);
  const [showTruthinessExplanation, setShowTruthinessExplanation] = useState(false);
  const [truthinessWeights, setTruthinessWeights] = useState<TruthinessWeights>({
    differenceWeight: 10,
    alignmentWeight: 50,
    errorAdmissionBonus: 20
  });

  // Function to validate and fetch URL content
  const validateAndFetchUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsValidatingUrl(true);
    setError('');
    
    try {
      const response = await fetch('/api/url-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to validate URL');
        return false;
      }
      
      setSource(data.content);
      setCaptureDate(data.captureDate);
      return true;
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while validating the URL');
      return false;
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Clear source and capture date when input mode changes
  useEffect(() => {
    setSource('');
    setCaptureDate(null);
    setUrl('');
    setError('');
  }, [inputMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    // For URL mode, validate and fetch content first
    if (inputMode === 'url') {
      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }
      
      // If we don't have source content yet, fetch it
      if (!source.trim()) {
        const isValid = await validateAndFetchUrl();
        if (!isValid) return;
      }
    } else {
      // Text mode validation
      if (!source.trim()) {
        setError('Please provide an authoritative source');
        return;
      }
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          question, 
          source, 
          inputMode,
          sourceUrl: inputMode === 'url' ? url : undefined,
          captureDate: captureDate || undefined,
          truthinessWeights
        }),
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
        
        {/* Input Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Source Input Mode
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="text-mode"
                type="radio"
                name="inputMode"
                value="text"
                checked={inputMode === 'text'}
                onChange={() => setInputMode('text')}
                className="mr-2"
                disabled={isSubmitting}
              />
              <label htmlFor="text-mode">Adhoc Text</label>
            </div>
            <div className="flex items-center">
              <input
                id="url-mode"
                type="radio"
                name="inputMode"
                value="url"
                checked={inputMode === 'url'}
                onChange={() => setInputMode('url')}
                className="mr-2"
                disabled={isSubmitting}
              />
              <label htmlFor="url-mode">URL</label>
            </div>
          </div>
        </div>
        
        {inputMode === 'url' ? (
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Source URL
            </label>
            <div className="flex space-x-2">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || isValidatingUrl}
              />
              <button
                type="button"
                onClick={validateAndFetchUrl}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting || isValidatingUrl || !url.trim()}
              >
                {isValidatingUrl ? 'Validating...' : 'Validate & Fetch'}
              </button>
            </div>
            {captureDate && (
              <p className="text-sm text-gray-500 mt-1">
                Content captured on: {new Date(captureDate).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Enter a valid URL to an article or webpage containing authoritative information.
            </p>
          </div>
        ) : (
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
        )}

        {inputMode === 'url' && source && (
          <div>
            <label htmlFor="fetched-content" className="block text-sm font-medium mb-2">
              Fetched Content Preview
            </label>
            <div 
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 max-h-64 overflow-auto"
            >
              <pre className="whitespace-pre-wrap text-sm">{source.substring(0, 500)}...</pre>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This is a preview of the content fetched from the URL (truncated for readability).
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowTruthinessExplanation(!showTruthinessExplanation)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            <svg 
              className={`w-4 h-4 mr-1 transition-transform ${showTruthinessExplanation ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            {showTruthinessExplanation ? 'Hide truthiness explanation' : 'Understand & adjust truthiness calculation'}
          </button>

          <TruthinessExplanation
            isOpen={showTruthinessExplanation}
            defaultWeights={truthinessWeights}
            onWeightsChange={setTruthinessWeights}
          />
        </div>

        <div className="flex justify-end mt-6">
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
