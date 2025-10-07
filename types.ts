
export enum AppView {
  HOME = 'HOME',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
}

export enum AnalysisMode {
  WASTE = 'WASTE',
  DISEASE = 'DISEASE',
}

export interface WasteClassificationResult {
  wasteType: string;
  recycling: {
    possible: boolean;
    instructions: string;
  };
  reuse: string;
  disposal: string;
  environmentalImpact: string;
  healthRisks: {
    name: string;
    description: string;
  }[];
}

export interface DiseasePredictionResult {
  overallRiskLevel: string;
  predictedDiseases: {
    name: string;
    cause: string;
    preventionTips: string[];
  }[];
}

export type AnalysisResult = WasteClassificationResult | DiseasePredictionResult | null;
