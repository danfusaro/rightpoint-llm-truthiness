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

  // URL validation and fetch logic
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
        headers: { 'Content-Type': 'application/json' },
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
    } catch {
      setError('An error occurred while validating the URL');
      return false;
    } finally {
      setIsValidatingUrl(false);
    }
  };

  useEffect(() => {
    setSource('');
    setCaptureDate(null);
    setUrl('');
    setError('');
  }, [inputMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) { setError('Please enter a question'); return; }
    if (inputMode === 'url' && !source.trim()) {
      const isValid = await validateAndFetchUrl();
      if (!isValid) return;
    } else if (inputMode === 'text' && !source.trim()) {
      setError('Please provide an authoritative source'); return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, source, inputMode,
          sourceUrl: inputMode === 'url' ? url : undefined,
          captureDate: captureDate || undefined,
          truthinessWeights
        }),
      });
      if (!response.ok) throw new Error('Failed to submit evaluation');
      const data = await response.json();
      router.push(`/results/${data.evaluationId}`);
    } catch {
      setError('An error occurred while submitting your evaluation');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-10 bg-white dark:bg-gray-900 rounded-lg shadow-md transition-colors duration-300">
      <h1 className="text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-gray-50">Evaluate LLM Truthiness</h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6 transition-colors duration-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Input */}
        <div>
          <label htmlFor="question" className="block font-medium mb-2 text-gray-800 dark:text-gray-200">Question</label>
          <textarea
            id="question"
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question for the LLM..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted mt-1">
            Ask a specific question that can be verified against your source.
          </p>
        </div>

        {/* Input Mode Selection */}
        <div>
          <label className="block font-medium mb-2 text-gray-800 dark:text-gray-200">Source Input Mode</label>
          <div className="flex space-x-6">
            {['text', 'url'].map((mode) => (
              <div key={mode} className="flex items-center">
                <input
                  id={`${mode}-mode`}
                  type="radio"
                  name="inputMode"
                  value={mode}
                  checked={inputMode === mode}
                  onChange={() => setInputMode(mode as 'text' | 'url')}
                  className="mr-2 accent-accent"
                  disabled={isSubmitting}
                />
                <label htmlFor={`${mode}-mode`} className="text-gray-800 dark:text-gray-200 capitalize">{mode === 'text' ? 'Adhoc Text' : 'URL'}</label>
              </div>
            ))}
          </div>
        </div>

        {/* URL Input */}
        {inputMode === 'url' && (
          <div>
            <label htmlFor="url" className="block font-medium mb-2 text-gray-800 dark:text-gray-200">Source URL</label>
            <div className="flex space-x-2">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-grow px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                disabled={isSubmitting || isValidatingUrl}
              />
              <button
                type="button"
                onClick={validateAndFetchUrl}
                disabled={isSubmitting || isValidatingUrl || !url.trim()}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
              >
                {isValidatingUrl ? 'Validating...' : 'Validate & Fetch'}
              </button>
            </div>
            {captureDate && (
              <p className="text-sm text-muted mt-1">
                Content captured on: {new Date(captureDate).toLocaleString()}
              </p>
            )}
            <p className="text-sm text-muted mt-1">
              Enter a valid URL to an article or webpage containing authoritative information.
            </p>
          </div>
        )}

        {/* Text Input */}
        {inputMode === 'text' && (
          <div>
            <label htmlFor="source" className="block font-medium mb-2 text-gray-800 dark:text-gray-200">Authoritative Source</label>
            <textarea
              id="source"
              rows={8}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Enter the authoritative source text..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted mt-1">
              Provide the authoritative source text that contains factual information related to your question.
            </p>
          </div>
        )}

        {/* Fetched Content Preview */}
        {inputMode === 'url' && source && (
          <div>
            <label className="block font-medium mb-2 text-gray-800 dark:text-gray-200">Fetched Content Preview</label>
            <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 max-h-96 overflow-auto transition-colors duration-200">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">{source}</pre>
            </div>
            <p className="text-sm text-muted mt-1">
              Full content extracted from the URL. Please review for accuracy before submitting.
            </p>
          </div>
        )}

        {/* Truthiness Explanation Toggle */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowTruthinessExplanation(!showTruthinessExplanation)}
            className="flex items-center text-accent hover:text-accent-dark text-sm font-medium transition-colors duration-200"
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

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Evaluation'}
          </button>
        </div>
      </form>
    </div>
  );
}