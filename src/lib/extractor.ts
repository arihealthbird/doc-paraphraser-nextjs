import { llamaCloud } from './llamacloud';
import { ExtractedDocument } from './types';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export class DocumentExtractor {
  async extractText(buffer: Buffer, fileType: string, filename: string = 'document'): Promise<ExtractedDocument> {
    console.log(`[Extractor] Extracting ${fileType} file, buffer size: ${buffer.length}`);
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPDF(buffer, filename);
        case 'docx':
        case 'doc':
          return await this.extractFromDOCX(buffer, filename);
        case 'txt':
          return this.extractFromTXT(buffer);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error: any) {
      console.error(`[Extractor] Error extracting ${fileType}:`, error);
      throw new Error(`Failed to extract text from ${fileType}: ${error.message}`);
    }
  }

  private async extractFromPDF(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    console.log('[Extractor] Starting PDF extraction with LlamaCloud');
    const markdown = await llamaCloud.parseDocument(buffer, filename);
    
    console.log(`[Extractor] PDF extracted: ${markdown.length} chars`);
    
    return {
      text: markdown,
      wordCount: countWords(markdown),
      // LlamaParse markdown endpoint doesn't include page count
    };
  }

  private async extractFromDOCX(buffer: Buffer, filename: string): Promise<ExtractedDocument> {
    console.log('[Extractor] Starting DOCX extraction with LlamaCloud');
    const markdown = await llamaCloud.parseDocument(buffer, filename);
    
    console.log(`[Extractor] DOCX extracted: ${markdown.length} chars`);
    
    return {
      text: markdown,
      wordCount: countWords(markdown),
    };
  }

  private extractFromTXT(buffer: Buffer): ExtractedDocument {
    console.log('[Extractor] Starting TXT extraction (direct buffer read)');
    const text = buffer.toString('utf-8');
    
    console.log(`[Extractor] TXT extracted: ${text.length} chars`);
    
    return {
      text,
      wordCount: countWords(text),
    };
  }
}
