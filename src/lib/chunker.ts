import { ChunkMetadata } from './types';

export class TextChunker {
  private readonly maxChunkSize: number;
  private readonly overlapSize: number;

  constructor(maxChunkSize: number = 4000, overlapSize: number = 200) {
    this.maxChunkSize = maxChunkSize;
    this.overlapSize = overlapSize;
  }

  chunkText(text: string): ChunkMetadata[] {
    const chunks: ChunkMetadata[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const potentialChunk = currentChunk 
        ? `${currentChunk}\n\n${paragraph}` 
        : paragraph;

      if (potentialChunk.length > this.maxChunkSize && currentChunk) {
        chunks.push({
          chunkIndex,
          totalChunks: 0,
          startPosition,
          endPosition: startPosition + currentChunk.length,
          text: currentChunk,
        });

        chunkIndex++;
        startPosition += currentChunk.length - this.overlapSize;
        
        const lastSentences = this.getLastSentences(currentChunk, this.overlapSize);
        currentChunk = `${lastSentences}\n\n${paragraph}`;
      } else if (potentialChunk.length > this.maxChunkSize) {
        const sentences = this.splitIntoSentences(paragraph);
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > this.maxChunkSize && currentChunk) {
            chunks.push({
              chunkIndex,
              totalChunks: 0,
              startPosition,
              endPosition: startPosition + currentChunk.length,
              text: currentChunk,
            });

            chunkIndex++;
            startPosition += currentChunk.length - this.overlapSize;
            currentChunk = this.getLastSentences(currentChunk, this.overlapSize) + sentence;
          } else {
            currentChunk += sentence;
          }
        }
      } else {
        currentChunk = potentialChunk;
      }
    }

    if (currentChunk) {
      chunks.push({
        chunkIndex,
        totalChunks: 0,
        startPosition,
        endPosition: startPosition + currentChunk.length,
        text: currentChunk,
      });
    }

    const totalChunks = chunks.length;
    chunks.forEach(chunk => chunk.totalChunks = totalChunks);

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  private getLastSentences(text: string, maxLength: number): string {
    const sentences = this.splitIntoSentences(text);
    let result = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const potential = sentences[i] + result;
      if (potential.length > maxLength) break;
      result = potential;
    }
    
    return result || text.slice(-maxLength);
  }
}
