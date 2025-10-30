import mammoth from 'mammoth';
import { ExtractedDocument } from './types';
import PDFParser from 'pdf2json';

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
    console.log('[Extractor] Starting PDF extraction with pdf2json');
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('[Extractor] PDF parsing error:', errData);
        reject(new Error(errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        // Extract text from all pages
        let text = '';
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const run of textItem.R) {
                    if (run.T) {
                      text += decodeURIComponent(run.T) + ' ';
                    }
                  }
                }
              }
            }
            text += '\n';
          }
        }
        
        const pageCount = pdfData.Pages?.length || 0;
        console.log(`PDF extracted: ${text.length} chars, ${pageCount} pages`);
        
        resolve({
          text: text.trim(),
          pageCount,
          wordCount: this.countWords(text),
        });
      });
      
      pdfParser.parseBuffer(buffer);
    });
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
