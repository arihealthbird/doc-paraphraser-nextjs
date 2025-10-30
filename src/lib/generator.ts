import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Paragraph, TextRun, Packer } from 'docx';

export class DocumentGenerator {
  /**
   * Generate document in specified format
   */
  async generate(text: string, format: string, originalFilename: string): Promise<Buffer> {
    switch (format.toLowerCase()) {
      case 'pdf':
        return await this.generatePDF(text);
      case 'docx':
      case 'doc':
        return await this.generateDOCX(text);
      case 'txt':
      default:
        return this.generateTXT(text);
    }
  }

  /**
   * Generate PDF from text
   */
  private async generatePDF(text: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    
    const fontSize = 11;
    const margin = 72; // 1 inch
    const lineHeight = fontSize * 1.5;
    const pageWidth = 612; // Letter size width
    const pageHeight = 792; // Letter size height
    const maxWidth = pageWidth - (margin * 2);

    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') continue;

      // Wrap text to fit page width
      const lines = this.wrapText(paragraph, maxWidth, fontSize, timesRomanFont);
      
      for (const line of lines) {
        // Check if we need a new page
        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: fontSize,
          font: timesRomanFont,
          color: rgb(0, 0, 0),
        });

        yPosition -= lineHeight;
      }

      // Add paragraph spacing
      yPosition -= lineHeight * 0.5;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Wrap text to fit within max width
   */
  private wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
    // First, handle any single newlines within the paragraph
    // Split by single newlines and process each line separately
    const textLines = text.split('\n');
    const lines: string[] = [];

    for (const textLine of textLines) {
      // Skip empty lines
      if (textLine.trim() === '') {
        lines.push('');
        continue;
      }

      const words = textLine.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }

  /**
   * Generate DOCX from text
   */
  private async generateDOCX(text: string): Promise<Buffer> {
    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    const docParagraphs = paragraphs.map(para => 
      new Paragraph({
        children: [
          new TextRun({
            text: para.trim(),
            size: 22, // 11pt (half-points)
            font: 'Times New Roman',
          }),
        ],
        spacing: {
          after: 200, // Paragraph spacing
        },
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch in twips (1/1440 inch)
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docParagraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * Generate TXT from text (simple pass-through)
   */
  private generateTXT(text: string): Buffer {
    return Buffer.from(text, 'utf-8');
  }

  /**
   * Get MIME type for format
   */
  getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
      case 'doc':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
      default:
        return 'text/plain';
    }
  }

  /**
   * Get file extension
   */
  getExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'txt':
      default:
        return 'txt';
    }
  }
}
