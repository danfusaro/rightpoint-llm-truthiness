'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import types
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

export default function ResultsPage() {
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchEvaluation() {
            try {
                const response = await fetch(`/api/evaluations/${id}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch evaluation results');
                }

                const data = await response.json();
                setEvaluation(data.evaluation);
            } catch (error) {
                console.error('Error fetching evaluation:', error);
                setError('Failed to load evaluation results. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchEvaluation();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <h1 className="text-3xl font-bold mb-4">Loading Results...</h1>
                <div className="animate-pulse mt-8">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (error || !evaluation) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <h1 className="text-3xl font-bold mb-4">Error</h1>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error || 'Failed to load evaluation results'}
                </div>
                <div className="mt-6">
                    <Link href="/evaluate" className="text-blue-600 hover:text-blue-800">
                        &larr; Back to Evaluation Form
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Truthiness Evaluation Results</h1>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Question</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {evaluation.question}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Authoritative Source</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{evaluation.source}</pre>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Response Without Source</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-80 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{evaluation.responseWithoutSource}</p>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Response With Source</h2>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-80 overflow-y-auto">
                        <p className="whitespace-pre-wrap">{evaluation.responseWithSource}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-10">
                <h2 className="text-2xl font-bold mb-6 text-center">Truthiness Score</h2>

                {evaluation.comparisonResults.truthinessScore < 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="font-semibold text-lg text-yellow-800">Using Simulated Responses</h3>
                        </div>
                        <p className="mt-2 text-yellow-700">
                            The LLM API was unavailable, so we're displaying simulated responses. Truthiness metrics are not calculated in this mode.
                        </p>
                    </div>
                ) : (
                    <div className="flex justify-center mb-6">
                        <div className="relative w-48 h-48">
                            {/* Circular progress indicator */}
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    className="text-gray-200"
                                    strokeWidth="10"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                                <circle
                                    className="text-blue-600"
                                    strokeWidth="10"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - evaluation.comparisonResults.truthinessScore / 100)}`}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="50"
                                    cy="50"
                                />
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <span className="text-4xl font-bold">{evaluation.comparisonResults.truthinessScore}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {evaluation.comparisonResults.truthinessScore >= 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium text-gray-500">Alignment Score</p>
                            <p className="text-2xl font-bold">{evaluation.comparisonResults.alignmentScore}%</p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium text-gray-500">Key Differences</p>
                            <p className="text-2xl font-bold">{evaluation.comparisonResults.differences.length}</p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium text-gray-500">Admits Error</p>
                            <p className="text-2xl font-bold">{evaluation.comparisonResults.admitsError ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                )}
            </div>

            {evaluation.comparisonResults.differences.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">Key Differences</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        {evaluation.comparisonResults.differences.map((diff, index) => (
                            <li key={index} className="text-gray-800">{diff}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-8 flex justify-between">
                <Link
                    href="/evaluate"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                    New Evaluation
                </Link>

                <Link
                    href="/"
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
