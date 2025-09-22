import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ComparisonResult, Evaluation, TruthinessWeights } from '@/interfaces';

// Export types from interfaces file
export type { Evaluation, ComparisonResult, TruthinessWeights };

// In-memory storage for serverless environments
let inMemoryEvaluations: Evaluation[] = [];

// Path to our "database" file
const DB_PATH = path.join(process.cwd(), 'data', 'evaluations.json');

// Check if we're in a serverless environment
const isServerlessEnvironment = () => {
  return process.env.NETLIFY || process.env.VERCEL || !fs.existsSync(path.dirname(DB_PATH));
}

// Ensure the data directory exists
function ensureDataDirExists() {
  if (isServerlessEnvironment()) {
    return; // Skip for serverless environments
  }
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ evaluations: [] }));
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    // Continue with in-memory storage
  }
}

// Get all evaluations
export function getAllEvaluations(): Evaluation[] {
  ensureDataDirExists();
  
  if (isServerlessEnvironment()) {
    return inMemoryEvaluations;
  }
  
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data).evaluations;
  } catch (error) {
    console.error('Error reading evaluations:', error);
    return inMemoryEvaluations;
  }
}

// Get evaluation by ID
export function getEvaluationById(id: string): Evaluation | null {
  const evaluations = getAllEvaluations();
  return evaluations.find(evaluation => evaluation.id === id) || null;
}

// Save a new evaluation (without comparison results initially)
export function saveNewEvaluation(
  question: string,
  source: string,
  inputMode: 'text' | 'url' = 'text',
  sourceUrl?: string,
  captureDate?: string,
  truthinessWeights?: TruthinessWeights
): string {
  ensureDataDirExists();
  
  const evaluations = getAllEvaluations();
  
  const newEvaluation: Evaluation = {
    id: uuidv4(),
    question,
    source,
    responseWithoutSource: '',
    responseWithSource: '',
    comparisonResults: {
      differences: [],
      alignmentScore: 0,
      admitsError: false,
      truthinessScore: 0
    },
    timestamp: new Date().toISOString(),
    inputMode,
    sourceUrl,
    captureDate,
    truthinessWeights
  };
  
  evaluations.push(newEvaluation);
  
  if (isServerlessEnvironment()) {
    // Store in memory for serverless environments
    inMemoryEvaluations.push(newEvaluation);
  } else {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify({ evaluations }, null, 2));
    } catch (error) {
      console.error('Error saving evaluation:', error);
      // Fallback to in-memory storage
      inMemoryEvaluations.push(newEvaluation);
    }
  }
  
  return newEvaluation.id;
}

// Update an evaluation with the responses and comparison results
export function updateEvaluation(
  id: string,
  responseWithoutSource: string,
  responseWithSource: string,
  comparisonResults: ComparisonResult
): boolean {
  const evaluations = getAllEvaluations();
  
  const index = evaluations.findIndex(evaluation => evaluation.id === id);
  
  if (index === -1) {
    return false;
  }
  
  const updatedEvaluation = {
    ...evaluations[index],
    responseWithoutSource,
    responseWithSource,
    comparisonResults
  };
  
  evaluations[index] = updatedEvaluation;
  
  if (isServerlessEnvironment()) {
    // Update in memory for serverless environments
    const memIndex = inMemoryEvaluations.findIndex(e => e.id === id);
    if (memIndex >= 0) {
      inMemoryEvaluations[memIndex] = updatedEvaluation;
    } else {
      inMemoryEvaluations.push(updatedEvaluation);
    }
  } else {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify({ evaluations }, null, 2));
    } catch (error) {
      console.error('Error updating evaluation:', error);
      // Fallback to updating in-memory storage
      const memIndex = inMemoryEvaluations.findIndex(e => e.id === id);
      if (memIndex >= 0) {
        inMemoryEvaluations[memIndex] = updatedEvaluation;
      } else {
        inMemoryEvaluations.push(updatedEvaluation);
      }
    }
  }
  
  return true;
}
