import { NextRequest, NextResponse } from 'next/server';
import { DocumentExtractor } from '@/lib/extractor';
import { ParaphrasingConfig } from '@/lib/types';
import { DatabaseService } from '../../../../lib/db/service';
import { TextChunker } from '@/lib/chunker';
import { ParaphrasingEngine } from '@/lib/engine';
import { HallucinationDetector } from '@/lib/hallucination';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes - safe limit for Vercel Pro (max 800s)

const dbService = DatabaseService.getInstance();

// Test endpoint
export async function GET() {
  return NextResponse.json({ 
    message: 'Paraphrase API is running',
    methods: ['POST'],
    version: '2.0.1-fixed'
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

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.error('OPENROUTER_API_KEY not configured properly');
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment variables.' 
      }, { status: 500 });
    }

    // Extract file info
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Only require LlamaCloud for PDF/DOCX
    const needsLlama = fileExtension === 'pdf' || fileExtension === 'docx' || fileExtension === 'doc';
    if (needsLlama && !process.env.LLAMACLOUD_API_KEY) {
      console.error('LLAMACLOUD_API_KEY not configured for PDF/DOCX parsing');
      return NextResponse.json(
        { error: 'LLAMACLOUD_API_KEY is not configured for PDF/DOCX parsing. Please set LLAMACLOUD_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from document
    console.log('Creating extractor and extracting text...');
    const extractor = new DocumentExtractor();
    const extracted = await extractor.extractText(buffer, fileExtension, file.name);
    console.log(`Extracted text length: ${extracted.text.length} chars, ${extracted.wordCount} words`);
    
    if (!extracted.text || extracted.text.trim().length === 0) {
      console.error('Extracted text is empty!');
      return NextResponse.json({ error: 'Failed to extract text from document. The file may be empty or corrupted.' }, { status: 400 });
    }

    // Calculate total chunks
    const chunker = new TextChunker();
    const chunks = chunker.chunkText(extracted.text);
    const totalChunks = chunks.length;
    console.log(`Processing document in ${totalChunks} chunks...`);

    // Store document in database
    const doc = await dbService.createDocument(
      file.name,
      fileExtension,
      file.size,
      extracted.text
    );

    // Create job
    const job = await dbService.createJob(doc.documentId, config, totalChunks);

    // Trigger processing via self-invocation (keeps function alive)
    const processingUrl = `${request.nextUrl.origin}/api/paraphrase/process`;
    console.log(`[PARAPHRASE] Triggering processing for job ${job.jobId}`);
    
    // Fire request and don't wait - let it run independently
    fetch(processingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.jobId,
        text: extracted.text,
        config,
      }),
    }).then(() => {
      console.log(`[PARAPHRASE] Processing request sent for job ${job.jobId}`);
    }).catch((err) => {
      console.error(`[PARAPHRASE] Failed to trigger processing for job ${job.jobId}:`, err);
    });

    // Return immediately so frontend can start polling
    return NextResponse.json({
      jobId: job.jobId,
      documentId: doc.documentId,
      totalChunks,
      status: 'processing',
      progress: 0,
      currentChunk: 0,
    });
  } catch (error: any) {
    console.error('Paraphrase API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
