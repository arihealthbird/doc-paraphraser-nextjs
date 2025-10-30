import { NextRequest, NextResponse } from 'next/server';
import { DocumentExtractor } from '@/lib/extractor';
import { ParaphrasingEngine } from '@/lib/engine';
import { ParaphrasingConfig } from '@/lib/types';
import { DatabaseService } from '../../../../lib/db/service';
import { TextChunker } from '@/lib/chunker';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const dbService = new DatabaseService();

// Test endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Paraphrase API is running',
    methods: ['POST'],
    version: '2.0.0-db'
  });
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/paraphrase called');
  try {
    console.log('Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configJson = formData.get('config') as string;
    console.log('File received:', file?.name, 'Size:', file?.size);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const config: ParaphrasingConfig = configJson ? JSON.parse(configJson) : {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Extract file info
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from document
    const extractor = new DocumentExtractor();
    const extracted = await extractor.extractText(buffer, fileExtension);

    // Calculate total chunks
    const chunker = new TextChunker();
    const chunks = chunker.chunkText(extracted.text);
    const totalChunks = chunks.length;

    // Store document in database
    const doc = await dbService.createDocument(
      file.name,
      fileExtension,
      file.size,
      extracted.text
    );

    // Create job
    const job = await dbService.createJob(doc.documentId, config, totalChunks);

    // Start background processing (don't await)
    processJobInBackground(job.jobId, extracted.text, config, apiKey);

    // Return job ID immediately
    return NextResponse.json({
      jobId: job.jobId,
      documentId: doc.documentId,
      totalChunks,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Paraphrase API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background processing function
async function processJobInBackground(
  jobId: string,
  text: string,
  config: ParaphrasingConfig,
  apiKey: string
) {
  try {
    const engine = new ParaphrasingEngine(apiKey);
    
    for await (const update of engine.paraphraseDocumentStreaming(text, config)) {
      if (update.type === 'progress') {
        await dbService.updateJobProgress(
          jobId,
          update.progress!,
          update.currentChunk!,
          'processing'
        );
      } else if (update.type === 'complete') {
        await dbService.completeJob(jobId, update.result!);
      } else if (update.type === 'error') {
        await dbService.failJob(jobId, update.error!);
      }
    }
  } catch (error: any) {
    console.error('Background processing error:', error);
    await dbService.failJob(jobId, error.message);
  }
}
