import { NextRequest } from 'next/server';
import { DocumentExtractor } from '@/lib/extractor';
import { ParaphrasingEngine } from '@/lib/engine';
import { ParaphrasingConfig } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large documents

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configJson = formData.get('config') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config: ParaphrasingConfig = configJson ? JSON.parse(configJson) : {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract file info
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from document
    const extractor = new DocumentExtractor();
    const extracted = await extractor.extractText(buffer, fileExtension);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const engine = new ParaphrasingEngine(apiKey);
        
        try {
          for await (const update of engine.paraphraseDocumentStreaming(extracted.text, config)) {
            const data = JSON.stringify(update) + '\n';
            controller.enqueue(encoder.encode(data));
          }
        } catch (error: any) {
          const errorUpdate = JSON.stringify({
            type: 'error',
            error: error.message,
          }) + '\n';
          controller.enqueue(encoder.encode(errorUpdate));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('Paraphrase API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
