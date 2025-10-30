import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/db/service';

const dbService = DatabaseService.getInstance();

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const { job, result, hallucinationScore } = await dbService.getJobWithResult(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`Job ${jobId} status: ${job.status}, result: ${result ? result.length + ' chars' : 'null'}`);

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      currentChunk: job.currentChunk,
      totalChunks: job.totalChunks,
      error: job.error,
      result: result,
      hallucinationScore: hallucinationScore,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
