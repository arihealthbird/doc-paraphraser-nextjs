import mammoth from 'mammoth';
import { ExtractedDocument } from './types';
import pdfParse from 'pdf-parse';

export class DocumentExtractor {
  async extractText(buffer: Buffer, fileType: string): Promise<ExtractedDocument> {
    console.log(`[Extractor] Extracting ${fileType} file, buffer size: ${buffer.length}`);
    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractFromPDF(buffer);
        case 'docx':
          return await this.extractFromDOCX(buffer);
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

  private async extractFromPDF(buffer: Buffer): Promise<ExtractedDocument> {
    console.log('[Extractor] Starting PDF extraction with pdf-parse');
    try {
      const data = await pdfParse(buffer);
      const text = data.text;
      const pageCount = data.numpages;
      
      console.log(`PDF extracted: ${text.length} chars, ${pageCount} pages`);
      
      return {
        text: text.trim(),
        pageCount,
        wordCount: this.countWords(text),
      };
    } catch (error: any) {
      console.error('[Extractor] PDF parsing error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  private async extractFromDOCX(buffer: Buffer): Promise<ExtractedDocument> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    return {
      text,
      wordCount: this.countWords(text),
    };
  }

  private extractFromTXT(buffer: Buffer): ExtractedDocument {
    const text = buffer.toString('utf-8');
    
    return {
      text,
      wordCount: this.countWords(text),
    };
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
