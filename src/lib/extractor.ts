import mammoth from 'mammoth';
import { ExtractedDocument } from './types';
// @ts-ignore - pdf-parse is a CommonJS module
const pdfParse = require('pdf-parse');

export class DocumentExtractor {
  async extractText(buffer: Buffer, fileType: string): Promise<ExtractedDocument> {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return this.extractFromPDF(buffer);
      case 'docx':
        return this.extractFromDOCX(buffer);
      case 'txt':
        return this.extractFromTXT(buffer);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<ExtractedDocument> {
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: this.countWords(data.text),
    };
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
