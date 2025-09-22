import { NextResponse } from "next/server";
import { saveNewEvaluation, updateEvaluation } from "@/lib/db";
import { queryLLM, getOfflineResponse } from "@/utils/openai";
import { TruthinessWeights, EvaluationRequest } from "@/interfaces";

// Function to compare responses and generate comparison metrics
function compareResponses(
  responseWithoutSource: string,
  responseWithSource: string,
  source: string,
  usedFallback = false,
  weights?: TruthinessWeights
) {
  // Extract key differences between responses
  const differences = extractDifferences(
    responseWithoutSource,
    responseWithSource
  );

  // Calculate alignment score (how much the source-based response aligns with the source)
  const alignmentScore = calculateAlignmentScore(responseWithSource, source);

  // Detect if the model admits error in the source-based response
  const admitsError = detectErrorAdmission(
    responseWithoutSource,
    responseWithSource
  );

  // Calculate the overall truthiness score
  const truthinessScore = calculateTruthinessScore(
    differences.length,
    alignmentScore,
    admitsError,
    usedFallback,
    weights
  );

  return {
    differences,
    alignmentScore,
    admitsError,
    truthinessScore,
  };
}

// Extract key differences between two responses
function extractDifferences(response1: string, response2: string) {
  // Simple implementation - split into sentences and compare
  const sentences1 = response1
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);
  const sentences2 = response2
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  const differences = [];

  // Find sentences in response2 that contradict response1
  for (const sentence2 of sentences2) {
    // This is a very basic check - in a real implementation, you would use
    // more sophisticated NLP techniques to detect contradictions
    if (
      !sentences1.some(
        (s1) =>
          s1.toLowerCase().includes(sentence2.toLowerCase()) ||
          sentence2.toLowerCase().includes(s1.toLowerCase())
      )
    ) {
      differences.push(sentence2.trim());
    }
  }

  return differences;
}

// Calculate how well the response aligns with the source
function calculateAlignmentScore(response: string, source: string) {
  // Simple implementation - count how many words from the source appear in the response
  const sourceWords = new Set(
    source
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3) // Only consider words with more than 3 characters
  );

  const responseWords = response.toLowerCase().split(/\W+/);

  let matchCount = 0;
  for (const word of responseWords) {
    if (sourceWords.has(word) && word.length > 3) {
      matchCount++;
    }
  }

  // Calculate score as a percentage (0-100)
  return Math.min(
    100,
    Math.round((matchCount / Math.max(1, sourceWords.size)) * 100)
  );
}

// Detect if the model admits making errors in the previous response
function detectErrorAdmission(
  responseWithoutSource: string,
  responseWithSource: string
) {
  // Check for phrases that indicate error admission
  const errorPhrases = [
    "i was incorrect",
    "i was wrong",
    "i made a mistake",
    "i apologize for the error",
    "correction",
    "incorrect information",
    "inaccurate",
    "mistaken",
    "error in my previous",
    "not accurate",
  ];

  const lowerResponse = responseWithSource.toLowerCase();

  // Check if any error phrases are present in the response
  return errorPhrases.some((phrase) => lowerResponse.includes(phrase));
}

// Calculate an overall truthiness score
function calculateTruthinessScore(
  differenceCount: number,
  alignmentScore: number,
  admitsError: boolean,
  usedFallback = false,
  weights?: TruthinessWeights
) {
  // Default weights if not provided
  const {
    differenceWeight = 10,
    alignmentWeight = 50,
    errorAdmissionBonus = 20
  } = weights || {};

  // Scoring formula with customizable weights:
  // - Start with 100 points
  // - Subtract differenceWeight points for each difference (up to 50 points)
  // - Add a percentage of alignment score based on alignmentWeight
  // - Add errorAdmissionBonus points if the model admits errors

  let score = 100;
  score -= Math.min(50, differenceCount * differenceWeight); // Cap at -50 points
  score += (alignmentScore * alignmentWeight) / 100; // Apply percentage of alignment score

  if (admitsError) {
    score += errorAdmissionBonus;
  }

  // If we used fallback responses, indicate this in the score
  if (usedFallback) {
    // Return a negative score to indicate fallback was used
    // This can be handled specially in the UI
    return -1;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as EvaluationRequest;
    const { question, source, inputMode, sourceUrl, captureDate, truthinessWeights } = body;

    // Input validation
    if (!question || !source) {
      return NextResponse.json(
        { error: "Question and source are required" },
        { status: 400 }
      );
    }

    // Additional validation for URL mode
    if (inputMode === 'url' && !sourceUrl) {
      return NextResponse.json(
        { error: "URL is required when using URL input mode" },
        { status: 400 }
      );
    }

    // Create a new evaluation entry with the appropriate mode and URL info if applicable
    const evaluationId = saveNewEvaluation(
      question, 
      source, 
      inputMode as 'text' | 'url', 
      sourceUrl, 
      captureDate,
      truthinessWeights
    );

    // In a production environment, you would likely queue these tasks
    // and process them asynchronously. For this POC, we'll do it in the request.

    // Query LLM without the source
    let responseWithoutSource;
    let responseWithSource;
    let usedFallback = false;

    console.log('Starting LLM evaluation for question:', question.substring(0, 50) + '...');  
    
    try {
      console.log('Querying LLM without source...');  
      responseWithoutSource = await queryLLM(question);
      console.log('Successfully received response without source');  

      // Query LLM with the source
      console.log('Querying LLM with source...');  
      responseWithSource = await queryLLM(question, source);
      console.log('Successfully received response with source');  
    } catch (error) {
      console.error("LLM API error:", error);
      
      console.log('Using fallback responses due to API error');  
      // Use fallback responses if the API is unavailable
      responseWithoutSource = getOfflineResponse(question, false);
      responseWithSource = getOfflineResponse(question, true);
      usedFallback = true;
    }

    // Compare responses and calculate metrics
    const comparisonResults = compareResponses(
      responseWithoutSource,
      responseWithSource,
      source,
      usedFallback, // Pass the fallback flag to adjust scoring if needed
      truthinessWeights // Pass the custom weights for truthiness calculation
    );

    // Update the evaluation with responses and results
    updateEvaluation(
      evaluationId,
      responseWithoutSource,
      responseWithSource,
      comparisonResults
    );

    // Return the evaluation ID for the client to redirect to results page
    return NextResponse.json({ evaluationId });
  } catch (error) {
    console.error("Error processing evaluation:", error);
    return NextResponse.json(
      { error: "Failed to process evaluation" },
      { status: 500 }
    );
  }
}
