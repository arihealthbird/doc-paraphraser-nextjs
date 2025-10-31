import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { marked } from 'marked';

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
   * Generate PDF from markdown text
   */
  private async generatePDF(text: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    
    const baseFontSize = 11;
    const margin = 72; // 1 inch
    const pageWidth = 612; // Letter size width
    const pageHeight = 792; // Letter size height
    const maxWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Parse markdown
    const tokens = marked.lexer(text);

    for (const token of tokens) {
      // Check if we need a new page
      if (yPosition < margin + 40) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      switch (token.type) {
        case 'heading':
          const headingSizes: { [key: number]: number } = {
            1: 24, 2: 18, 3: 16, 4: 14, 5: 12, 6: 11
          };
          const headingSize = headingSizes[token.depth] || 11;
          const headingText = this.stripMarkdown(token.text);
          const headingLines = this.wrapText(headingText, maxWidth, headingSize, timesBoldFont);
          
          for (const line of headingLines) {
            if (yPosition < margin + headingSize * 1.5) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: headingSize,
              font: timesBoldFont,
              color: rgb(0, 0, 0),
            });
            yPosition -= headingSize * 1.5;
          }
          yPosition -= headingSize * 0.5; // Extra spacing after heading
          break;

        case 'paragraph':
          const paraText = this.stripMarkdown(token.text);
          const paraLines = this.wrapText(paraText, maxWidth, baseFontSize, timesRomanFont);
          
          for (const line of paraLines) {
            if (yPosition < margin + baseFontSize * 1.5) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
            page.drawText(line, {
              x: margin,
              y: yPosition,
              size: baseFontSize,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            });
            yPosition -= baseFontSize * 1.5;
          }
          yPosition -= baseFontSize * 0.5; // Paragraph spacing
          break;

        case 'list':
          token.items.forEach((item: any, index: number) => {
            const bullet = token.ordered ? `${index + 1}.` : '•';
            const itemText = this.stripMarkdown(item.text);
            const indentedMaxWidth = maxWidth - 30; // Indent for bullets
            const itemLines = this.wrapText(itemText, indentedMaxWidth, baseFontSize, timesRomanFont);
            
            itemLines.forEach((line, lineIndex) => {
              if (yPosition < margin + baseFontSize * 1.5) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
              }
              const xPos = lineIndex === 0 ? margin : margin + 30;
              const displayText = lineIndex === 0 ? `${bullet} ${line}` : line;
              page.drawText(displayText, {
                x: xPos,
                y: yPosition,
                size: baseFontSize,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
              });
              yPosition -= baseFontSize * 1.5;
            });
          });
          yPosition -= baseFontSize * 0.5; // List spacing
          break;

        case 'blockquote':
          const quoteText = this.stripMarkdown(token.text);
          const quoteLines = this.wrapText(quoteText, maxWidth - 40, baseFontSize, timesItalicFont);
          
          for (const line of quoteLines) {
            if (yPosition < margin + baseFontSize * 1.5) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
            page.drawText(line, {
              x: margin + 40, // Indented
              y: yPosition,
              size: baseFontSize,
              font: timesItalicFont,
              color: rgb(0.3, 0.3, 0.3),
            });
            yPosition -= baseFontSize * 1.5;
          }
          yPosition -= baseFontSize * 0.5;
          break;

        case 'code':
          const codeLines = token.text.split('\n');
          for (const codeLine of codeLines) {
            if (yPosition < margin + 10 * 1.5) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
            page.drawText(codeLine, {
              x: margin + 20,
              y: yPosition,
              size: 10,
              font: courierFont,
              color: rgb(0, 0, 0),
            });
            yPosition -= 10 * 1.5;
          }
          yPosition -= 10;
          break;

        case 'table':
          // Simplified table rendering as text grid
          page.drawText('[Table content - see original document]', {
            x: margin,
            y: yPosition,
            size: baseFontSize,
            font: timesItalicFont,
            color: rgb(0.4, 0.4, 0.4),
          });
          yPosition -= baseFontSize * 2;
          break;

        case 'space':
          // Skip extra spacing
          break;

        default:
          // Fallback
          if ('text' in token) {
            const fallbackText = this.stripMarkdown(token.text);
            const fallbackLines = this.wrapText(fallbackText, maxWidth, baseFontSize, timesRomanFont);
            for (const line of fallbackLines) {
              if (yPosition < margin + baseFontSize * 1.5) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
              }
              page.drawText(line, {
                x: margin,
                y: yPosition,
                size: baseFontSize,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
              });
              yPosition -= baseFontSize * 1.5;
            }
          }
      }
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
   * Generate DOCX from markdown text
   */
  private async generateDOCX(text: string): Promise<Buffer> {
    const tokens = marked.lexer(text);
    const docElements: any[] = [];

    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          docElements.push(this.createHeading(token.text, token.depth));
          break;
        case 'paragraph':
          docElements.push(this.createParagraph(token.text));
          break;
        case 'list':
          docElements.push(...this.createList(token));
          break;
        case 'table':
          docElements.push(this.createTable(token));
          break;
        case 'blockquote':
          docElements.push(this.createBlockquote(token.text));
          break;
        case 'code':
          docElements.push(this.createCodeBlock(token.text));
          break;
        case 'space':
          // Skip extra spacing
          break;
        default:
          // Fallback for any unhandled token types
          if ('text' in token) {
            docElements.push(this.createParagraph(token.text));
          }
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: docElements.length > 0 ? docElements : [new Paragraph({ text: '' })],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * Create heading paragraph for DOCX
   */
  private createHeading(text: string, level: number): Paragraph {
    const headingLevels: { [key: number]: typeof HeadingLevel[keyof typeof HeadingLevel] } = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3,
      4: HeadingLevel.HEADING_4,
      5: HeadingLevel.HEADING_5,
      6: HeadingLevel.HEADING_6,
    };

    return new Paragraph({
      text: this.stripMarkdown(text),
      heading: headingLevels[level] || HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    });
  }

  /**
   * Create paragraph with inline formatting (bold, italic)
   */
  private createParagraph(text: string): Paragraph {
    const runs = this.parseInlineFormatting(text);
    return new Paragraph({
      children: runs,
      spacing: { after: 200 },
    });
  }

  /**
   * Parse inline markdown formatting (bold, italic, code)
   */
  private parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const cleanText = this.stripMarkdown(text);
    
    // Simple approach: parse bold and italic
    const boldItalicRegex = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
    let lastIndex = 0;
    let match;

    while ((match = boldItalicRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        runs.push(new TextRun({
          text: text.substring(lastIndex, match.index),
          size: 22,
          font: 'Times New Roman',
        }));
      }

      // Add formatted text
      if (match[1]) {
        // Bold + Italic
        runs.push(new TextRun({
          text: match[1],
          bold: true,
          italics: true,
          size: 22,
          font: 'Times New Roman',
        }));
      } else if (match[2]) {
        // Bold
        runs.push(new TextRun({
          text: match[2],
          bold: true,
          size: 22,
          font: 'Times New Roman',
        }));
      } else if (match[3]) {
        // Italic
        runs.push(new TextRun({
          text: match[3],
          italics: true,
          size: 22,
          font: 'Times New Roman',
        }));
      } else if (match[4]) {
        // Code
        runs.push(new TextRun({
          text: match[4],
          font: 'Courier New',
          size: 20,
        }));
      }

      lastIndex = boldItalicRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      runs.push(new TextRun({
        text: text.substring(lastIndex),
        size: 22,
        font: 'Times New Roman',
      }));
    }

    // Fallback if no formatting found
    if (runs.length === 0) {
      runs.push(new TextRun({
        text: cleanText,
        size: 22,
        font: 'Times New Roman',
      }));
    }

    return runs;
  }

  /**
   * Create list items for DOCX
   */
  private createList(token: any): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    
    token.items.forEach((item: any, index: number) => {
      const runs = this.parseInlineFormatting(item.text);
      paragraphs.push(new Paragraph({
        children: runs,
        bullet: token.ordered ? undefined : { level: 0 },
        numbering: token.ordered ? { reference: 'default-numbering', level: 0 } : undefined,
        spacing: { after: 100 },
      }));
    });

    return paragraphs;
  }

  /**
   * Create table for DOCX
   */
  private createTable(token: any): Table {
    const rows: TableRow[] = [];

    // Header row
    if (token.header && token.header.length > 0) {
      rows.push(new TableRow({
        children: token.header.map((cell: any) => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: this.stripMarkdown(cell.text),
              bold: true,
              size: 22,
            })],
          })],
          shading: { fill: 'D9D9D9' },
        })),
      }));
    }

    // Body rows
    token.rows.forEach((row: any) => {
      rows.push(new TableRow({
        children: row.map((cell: any) => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({
              text: this.stripMarkdown(cell.text),
              size: 22,
            })],
          })],
        })),
      }));
    });

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  /**
   * Create blockquote for DOCX
   */
  private createBlockquote(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({
        text: this.stripMarkdown(text),
        italics: true,
        size: 22,
      })],
      indent: { left: 720 }, // 0.5 inch indent
      spacing: { after: 200 },
    });
  }

  /**
   * Create code block for DOCX
   */
  private createCodeBlock(text: string): Paragraph {
    return new Paragraph({
      children: [new TextRun({
        text: text,
        font: 'Courier New',
        size: 20,
      })],
      shading: { fill: 'F5F5F5' },
      spacing: { after: 200 },
    });
  }

  /**
   * Strip markdown formatting from text
   */
  private stripMarkdown(text: string): string {
    return text
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // Bold + Italic
      .replace(/\*\*(.+?)\*\*/g, '$1')       // Bold
      .replace(/\*(.+?)\*/g, '$1')           // Italic
      .replace(/`(.+?)`/g, '$1')             // Code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // Links
      .trim();
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
