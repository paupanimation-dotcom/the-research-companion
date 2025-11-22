
export enum ResearchMode {
  BIAS = 'BIAS',
  INSIGHT = 'INSIGHT',
  INTEGRITY = 'INTEGRITY',
  GENERAL = 'GENERAL'
}

export interface AnalysisResponse {
  text: string;
  isComplete: boolean;
}

export interface ModeConfig {
  id: ResearchMode;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  promptContext: string;
}

export interface DevPrompt {
  id: string;
  suggestion: string;
  timestamp: number;
  status: 'pending' | 'implemented';
}

export interface ResearchDocument {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'txt' | 'md' | 'docx' | 'odt' | 'url';
  uploadTimestamp: number;
}

export interface Session {
  id: string;
  title: string;
  mode: ResearchMode;
  inputText: string;
  analysisContent: string;
  timestamp: number;
  documents: ResearchDocument[];
}

export interface SynthesisRow {
  source_title: string;
  [key: string]: string;
}

export interface SynthesisData {
  dimensions: string[];
  rows: SynthesisRow[];
}

// Grounding / Search Interfaces
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  webSearchQueries: string[];
}
