import mammoth from 'mammoth';
import { ExtractedDocument } from './types';

// Dynamic import for pdf-parse (CommonJS module)
const getPdfParse = async () => {
  const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
  return pdfParse.default;
};

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
    const pdf = await getPdfParse();
    const data = await pdf(buffer);
    
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
