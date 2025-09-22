export interface TruthinessWeights {
  differenceWeight: number;
  alignmentWeight: number;
  errorAdmissionBonus: number;
}

export interface EvaluationRequest {
  question: string;
  source: string;
  inputMode?: 'text' | 'url';
  sourceUrl?: string;
  captureDate?: string;
  truthinessWeights?: TruthinessWeights;
}

export interface ComparisonResult {
  differences: string[];
  alignmentScore: number;
  admitsError: boolean;
  truthinessScore: number;
}

export interface Evaluation {
  id: string;
  question: string;
  source: string;
  responseWithoutSource: string;
  responseWithSource: string;
  comparisonResults: ComparisonResult;
  timestamp: string;
  inputMode?: 'text' | 'url';
  sourceUrl?: string;
  captureDate?: string;
  truthinessWeights?: TruthinessWeights;
}
