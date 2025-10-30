import { NextRequest, NextResponse } from 'next/server';
import { DocumentExtractor } from '@/lib/extractor';
import { ParaphrasingEngine } from '@/lib/engine';
import { ParaphrasingConfig } from '@/lib/types';
import { DatabaseService } from '../../../../lib/db/service';
import { TextChunker } from '@/lib/chunker';
import { HallucinationDetector } from '@/lib/hallucination';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const dbService = DatabaseService.getInstance();

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

    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.error('OPENROUTER_API_KEY not configured properly');
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your environment variables.' 
      }, { status: 500 });
    }

    // Extract file info
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from document
    const extractor = new DocumentExtractor();
    const extracted = await extractor.extractText(buffer, fileExtension);
    console.log(`Extracted text length: ${extracted.text.length} chars, ${extracted.wordCount} words`);

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

    // Process synchronously (Vercel serverless doesn't support true background jobs)
    await processJobInBackground(job.jobId, extracted.text, config, apiKey);

    // Get final result
    const { result, hallucinationScore } = await dbService.getJobWithResult(job.jobId);

    // Return complete result
    return NextResponse.json({
      jobId: job.jobId,
      documentId: doc.documentId,
      totalChunks,
      status: 'completed',
      result: result,
      hallucinationScore: hallucinationScore,
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
  console.log(`Starting background processing for job ${jobId}`);
  try {
    const engine = new ParaphrasingEngine(apiKey);
    const hallucinationDetector = new HallucinationDetector();
    let paraphrasedResult = '';
    
    for await (const update of engine.paraphraseDocumentStreaming(text, config)) {
      console.log(`Job ${jobId} update:`, update.type, update.progress);
      if (update.type === 'progress') {
        await dbService.updateJobProgress(
          jobId,
          update.progress!,
          update.currentChunk!,
          'processing'
        );
      } else if (update.type === 'complete') {
        console.log(`Job ${jobId} completed, result length: ${update.result?.length}`);
        paraphrasedResult = update.result!;
        
        // Calculate hallucination score
        console.log(`Calculating hallucination score for job ${jobId}...`);
        const hallucinationScore = await hallucinationDetector.calculateScore(text, paraphrasedResult);
        console.log(`Hallucination score: ${hallucinationScore}`);
        
        await dbService.completeJob(jobId, paraphrasedResult, hallucinationScore);
        console.log(`Job ${jobId} saved to database`);
      } else if (update.type === 'error') {
        console.error(`Job ${jobId} error:`, update.error);
        await dbService.failJob(jobId, update.error!);
      }
    }
    console.log(`Background processing finished for job ${jobId}`);
    
    // Double-check job was marked complete
    const finalJob = await dbService.getJob(jobId);
    console.log(`Final job status: ${finalJob?.status}`);
  } catch (error: any) {
    console.error('Background processing error:', error);
    await dbService.failJob(jobId, error.message);
  }
}
