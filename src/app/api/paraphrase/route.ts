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
export const maxDuration = 900; // 15 minutes (Vercel Pro limit)

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

    // Process synchronously - we MUST await to keep function alive
    // Vercel Pro allows 15 minutes, which should be enough
    console.log(`[PARAPHRASE] Starting processing for job ${job.jobId}`);
    await processJobAsync(job.jobId, extracted.text, config, apiKey);
    console.log(`[PARAPHRASE] Processing complete for job ${job.jobId}`);

    // Fetch final result
    const { job: completedJob, result: resultText, hallucinationScore } = await dbService.getJobWithResult(job.jobId);

    return NextResponse.json({
      jobId: job.jobId,
      documentId: doc.documentId,
      totalChunks,
      status: completedJob?.status || 'failed',
      progress: completedJob?.progress || 100,
      currentChunk: completedJob?.currentChunk || totalChunks,
      result: resultText || null,
      hallucinationScore: hallucinationScore ?? null,
      error: completedJob?.error || null,
    });
  } catch (error: any) {
    console.error('Paraphrase API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Async processing function that runs in background
async function processJobAsync(
  jobId: string,
  text: string,
  config: ParaphrasingConfig,
  apiKey: string
) {
  console.log(`Starting async processing for job ${jobId}`);
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
    console.log(`Async processing finished for job ${jobId}`);
    
    // Double-check job was marked complete
    const finalJob = await dbService.getJob(jobId);
    console.log(`Final job status: ${finalJob?.status}`);
  } catch (error: any) {
    console.error('Async processing error:', error);
    await dbService.failJob(jobId, error.message);
  }
}
