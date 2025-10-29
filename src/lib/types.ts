export interface ParaphrasingConfig {
  tone?: 'formal' | 'casual' | 'neutral';
  formality?: 'high' | 'medium' | 'low';
  creativity?: 'conservative' | 'moderate' | 'creative';
  preserveFormatting?: boolean;
  model?: string;
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
