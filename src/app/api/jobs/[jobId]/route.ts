import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/db/service';

const dbService = new DatabaseService();

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const { job, result } = await dbService.getJobWithResult(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      currentChunk: job.currentChunk,
      totalChunks: job.totalChunks,
      error: job.error,
      result: result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error: any) {
    console.error('Job status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
