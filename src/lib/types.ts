export interface ParaphrasingConfig {
  tone?: 'formal' | 'casual' | 'neutral';
  formality?: 'high' | 'medium' | 'low';
  creativity?: 'conservative' | 'moderate' | 'creative';
  preserveFormatting?: boolean;
  model?: string;
  intensity?: number; // 1-5: 1=minimal changes, 5=complete rewrite
}

export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  startPosition: number;
  endPosition: number;
  text: string;
}

export interface ParaphrasedChunk {
  chunkIndex: number;
  originalText: string;
  paraphrasedText: string;
}

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
  wordCount: number;
}

export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  currentChunk?: number;
  totalChunks?: number;
  result?: string;
  error?: string;
}

// Progress indicator stages
export type Stage = 'upload_parse' | 'analyze_chunk' | 'paraphrase' | 'quality_check' | 'finalize';
export type StageStatus = 'pending' | 'in_progress' | 'complete';

export const STAGES: { key: Stage; label: string }[] = [
  { key: 'upload_parse', label: 'Upload & Parsing' },
  { key: 'analyze_chunk', label: 'Analysis & Chunking' },
  { key: 'paraphrase', label: 'AI Paraphrasing' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'finalize', label: 'Finalization' },
];

export function inferStage(job: {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentChunk: number;
  totalChunks: number;
}): Stage {
  // Completed
  if (job.status === 'completed') return 'finalize';
  
  // Quality check phase (all chunks done, finalizing)
  if (job.progress >= 95 && job.currentChunk === job.totalChunks && job.totalChunks > 0) {
    return 'quality_check';
  }
  
  // Paraphrasing phase (actively processing chunks)
  if (job.currentChunk > 0 && job.currentChunk <= job.totalChunks) {
    return 'paraphrase';
  }
  
  // Analysis/chunking phase (totalChunks set but no chunks processed yet)
  if (job.totalChunks > 0 && job.currentChunk === 0) {
    return 'analyze_chunk';
  }
  
  // Upload/parsing phase (initial state)
  return 'upload_parse';
}
