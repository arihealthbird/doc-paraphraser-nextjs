import { OpenRouterService } from './openrouter';
import { TextChunker } from './chunker';
import { ParaphrasingConfig, ParaphrasedChunk, ProgressUpdate } from './types';

export class ParaphrasingEngine {
  private openRouterService: OpenRouterService;
  private chunker: TextChunker;

  constructor(apiKey: string, maxChunkSize: number = 4000) {
    this.openRouterService = new OpenRouterService(apiKey);
    this.chunker = new TextChunker(maxChunkSize);
  }

  async* paraphraseDocumentStreaming(
    text: string,
    config: ParaphrasingConfig
  ): AsyncGenerator<ProgressUpdate> {
    const chunks = this.chunker.chunkText(text);
    const totalChunks = chunks.length;
    
    console.log(`Processing document in ${totalChunks} chunks...`);

    const paraphrasedChunks: ParaphrasedChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        console.log(`Processing chunk ${i + 1}/${totalChunks}...`);
        
        const paraphrasedText = await this.openRouterService.paraphraseText(
          chunk.text,
          config
        );

        paraphrasedChunks.push({
          chunkIndex: i,
          originalText: chunk.text,
          paraphrasedText,
        });

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        yield {
          type: 'progress',
          progress,
          currentChunk: i + 1,
          totalChunks,
        };

        if (i < chunks.length - 1) {
          await this.delay(1000);
        }
      } catch (error: any) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        yield {
          type: 'error',
          error: `Failed at chunk ${i + 1}/${totalChunks}: ${error.message}`,
        };
        return;
      }
    }

    const reconstructed = this.reconstructDocument(paraphrasedChunks);
    yield {
      type: 'complete',
      result: reconstructed,
    };
  }

  private reconstructDocument(paraphrasedChunks: ParaphrasedChunk[]): string {
    const sortedChunks = paraphrasedChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    let reconstructed = '';
    
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];
      
      if (i === 0) {
        reconstructed = chunk.paraphrasedText;
      } else {
        const previousChunk = sortedChunks[i - 1];
        const cleanedChunk = this.removeOverlap(
          previousChunk.paraphrasedText,
          chunk.paraphrasedText
        );
        
        if (!reconstructed.endsWith('\n\n')) {
          reconstructed += '\n\n';
        }
        
        reconstructed += cleanedChunk;
      }
    }
    
    return reconstructed.trim();
  }

  private removeOverlap(previousText: string, currentText: string): string {
    const previousSentences = previousText.split(/[.!?]+/).slice(-3);
    
    for (let i = 0; i < previousSentences.length; i++) {
      const overlap = previousSentences.slice(i).join('.');
      if (overlap && currentText.startsWith(overlap.trim())) {
        return currentText.slice(overlap.length).trim();
      }
    }
    
    return currentText;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
