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
      const pdfParser = new PDFParser(null, 1);
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('[Extractor] PDF parser error:', errData.parserError);
        reject(new Error(`PDF parsing failed: ${errData.parserError}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let fullText = '';
          
          // Extract text from all pages
          if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
            for (const page of pdfData.Pages) {
              if (page.Texts && Array.isArray(page.Texts)) {
                for (const textItem of page.Texts) {
                  if (textItem.R && Array.isArray(textItem.R)) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        // Decode URI-encoded text
                        fullText += decodeURIComponent(run.T) + ' ';
                      }
                    }
                  }
                }
              }
              fullText += '\n\n';
            }
          }
          
          const text = fullText.trim();
          const pageCount = pdfData.Pages?.length || 0;
          
          console.log(`[Extractor] PDF extracted: ${text.length} chars, ${pageCount} pages`);
          
          if (text.length === 0) {
            reject(new Error('PDF appears to be empty or contains only images'));
            return;
          }
          
          resolve({
            text,
            pageCount,
            wordCount: this.countWords(text),
          });
        } catch (error: any) {
          console.error('[Extractor] Error processing PDF data:', error);
          reject(new Error(`PDF data processing failed: ${error.message}`));
        }
      });
      
      // Parse the buffer
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
