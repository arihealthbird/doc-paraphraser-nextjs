import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../../../lib/db/service';
import { DocumentGenerator } from '@/lib/generator';

const dbService = DatabaseService.getInstance();

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute for document generation

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Get job and result
    const { job, result } = await dbService.getJobWithResult(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'completed' || !result) {
      return NextResponse.json({ error: 'Job not completed or result not available' }, { status: 400 });
    }

    // Get original document to determine file type
    const document = await dbService.getDocument(job.documentId);
    
    if (!document) {
      return NextResponse.json({ error: 'Original document not found' }, { status: 404 });
    }

    const fileType = document.fileType;
    const originalFilename = document.filename;
    const baseFilename = originalFilename.replace(/\.[^.]+$/, '');

    // Generate document in original format
    console.log(`Generating ${fileType} document for job ${jobId}...`);
    const generator = new DocumentGenerator();
    const buffer = await generator.generate(result, fileType, originalFilename);

    const extension = generator.getExtension(fileType);
    const mimeType = generator.getMimeType(fileType);
    const downloadFilename = `paraphrased_${baseFilename}.${extension}`;

    console.log(`Generated ${fileType} (${buffer.length} bytes), filename: ${downloadFilename}`);

    // Return the file as a download
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(buffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
