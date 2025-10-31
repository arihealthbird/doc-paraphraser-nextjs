import { NextRequest, NextResponse } from 'next/server';
import { ParaphrasingEngine } from '@/lib/engine';
import { ParaphrasingConfig } from '@/lib/types';
import { DatabaseService } from '../../../../lib/db/service';
import { HallucinationDetector } from '@/lib/hallucination';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const dbService = DatabaseService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const { jobId, text, config } = await request.json();
    
    if (!jobId || !text || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log(`[WORKER] Starting processing for job ${jobId}`);
    
    const engine = new ParaphrasingEngine(apiKey);
    const hallucinationDetector = new HallucinationDetector();
    let paraphrasedResult = '';
    
    for await (const update of engine.paraphraseDocumentStreaming(text, config)) {
      console.log(`[WORKER] Job ${jobId} update:`, update.type, update.progress);
      
      if (update.type === 'progress') {
        await dbService.updateJobProgress(
          jobId,
          update.progress!,
          update.currentChunk!,
          'processing'
        );
      } else if (update.type === 'complete') {
        console.log(`[WORKER] Job ${jobId} completed, result length: ${update.result?.length}`);
        paraphrasedResult = update.result!;
        
        // Calculate hallucination score
        console.log(`[WORKER] Calculating hallucination score for job ${jobId}...`);
        const hallucinationScore = await hallucinationDetector.calculateScore(text, paraphrasedResult);
        console.log(`[WORKER] Hallucination score: ${hallucinationScore}`);
        
        await dbService.completeJob(jobId, paraphrasedResult, hallucinationScore);
        console.log(`[WORKER] Job ${jobId} saved to database`);
      } else if (update.type === 'error') {
        console.error(`[WORKER] Job ${jobId} error:`, update.error);
        await dbService.failJob(jobId, update.error!);
      }
    }
    
    console.log(`[WORKER] Processing finished for job ${jobId}`);
    
    return NextResponse.json({ success: true, jobId });
  } catch (error: any) {
    console.error('[WORKER] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
