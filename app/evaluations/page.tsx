'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ComparisonResult {
  differences: string[];
  alignmentScore: number;
  admitsError: boolean;
  truthinessScore: number;
}

interface Evaluation {
  id: string;
  question: string;
  source: string;
  responseWithoutSource: string;
  responseWithSource: string;
  comparisonResults: ComparisonResult;
  timestamp: string;
}

export default function EvaluationsPage() {
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const response = await fetch('/api/evaluations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch evaluations');
        }
        
        const data = await response.json();
        setEvaluations(data.evaluations);
      } catch (error) {
        console.error('Error fetching evaluations:', error);
        setError('Failed to load evaluation history');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvaluations();
  }, []);
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }
  
  function truncateText(text: string, maxLength = 100) {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Evaluation History</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Evaluation History</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Evaluation History</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          {evaluations.length} {evaluations.length === 1 ? 'evaluation' : 'evaluations'} found
        </p>
        <Link 
          href="/evaluate" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          New Evaluation
        </Link>
      </div>
      
      {evaluations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">No evaluations found</p>
          <Link 
            href="/evaluate" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create your first evaluation
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Truthiness Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(evaluation.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {truncateText(evaluation.question)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {evaluation.comparisonResults.truthinessScore < 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Simulated
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${evaluation.comparisonResults.truthinessScore >= 80 ? 'bg-green-100 text-green-800' : 
                              evaluation.comparisonResults.truthinessScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}
                        >
                          {evaluation.comparisonResults.truthinessScore}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/results/${evaluation.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
