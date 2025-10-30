import { eq } from 'drizzle-orm';
import { db } from './client';
import { documents, paraphraseJobs, paraphraseResults } from './schema';
import { ParaphrasingConfig } from '../../src/lib/types';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseService {
  private static instance: DatabaseService;
  
  // Singleton pattern to ensure one instance across all API routes
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  async createDocument(filename: string, fileType: string, fileSize: number, content: string) {
    const documentId = uuidv4();
    
    const [doc] = await db.insert(documents).values({
      documentId,
      filename,
      fileType,
      fileSize,
      content,
    }).returning();
    
    return doc;
  }

  async createJob(documentId: string, config: ParaphrasingConfig, totalChunks: number) {
    const jobId = uuidv4();
    
    const [job] = await db.insert(paraphraseJobs).values({
      jobId,
      documentId,
      status: 'pending',
      progress: 0,
      currentChunk: 0,
      totalChunks,
      config,
    }).returning();
    
    return job;
  }

  async updateJobProgress(jobId: string, progress: number, currentChunk: number, status: string = 'processing') {
    const [job] = await db.update(paraphraseJobs)
      .set({
        progress,
        currentChunk,
        status,
        updatedAt: new Date(),
      })
      .where(eq(paraphraseJobs.jobId, jobId))
      .returning();
    
    return job;
  }

  async completeJob(jobId: string, result: string, hallucinationScore?: number) {
    console.log(`[DB] Completing job ${jobId}, result length: ${result?.length}, score: ${hallucinationScore}`);
    
    // Store result first
    await db.insert(paraphraseResults).values({
      jobId,
      result,
      hallucinationScore,
    });
    console.log(`[DB] Result inserted for job ${jobId}`);

    // Update job status
    await db.update(paraphraseJobs)
      .set({
        status: 'completed',
        progress: 100,
        updatedAt: new Date(),
      })
      .where(eq(paraphraseJobs.jobId, jobId));
    
    console.log(`[DB] Job ${jobId} update query executed`);
    
    // Force a fresh read to verify
    const [verifyJob] = await db.select()
      .from(paraphraseJobs)
      .where(eq(paraphraseJobs.jobId, jobId));
    
    console.log(`[DB] Verification read: status=${verifyJob?.status}, progress=${verifyJob?.progress}`);
    return verifyJob;
  }

  async failJob(jobId: string, error: string) {
    await db.update(paraphraseJobs)
      .set({
        status: 'failed',
        error,
        updatedAt: new Date(),
      })
      .where(eq(paraphraseJobs.jobId, jobId));
  }


  async getJob(jobId: string) {
    const [job] = await db.select()
      .from(paraphraseJobs)
      .where(eq(paraphraseJobs.jobId, jobId));
    
    console.log(`[DB] getJob(${jobId}): status=${job?.status}, progress=${job?.progress}`);
    return job;
  }

  async getJobWithResult(jobId: string) {
    const job = await this.getJob(jobId);
    if (!job || job.status !== 'completed') {
      return { job, result: null, hallucinationScore: null };
    }

    const [result] = await db.select()
      .from(paraphraseResults)
      .where(eq(paraphraseResults.jobId, jobId));
    
    return { 
      job, 
      result: result?.result || null,
      hallucinationScore: result?.hallucinationScore ?? null,
    };
  }

  async getDocument(documentId: string) {
    const [doc] = await db.select()
      .from(documents)
      .where(eq(documents.documentId, documentId));
    
    return doc;
  }
}
