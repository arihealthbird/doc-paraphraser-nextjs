# Neon PostgreSQL Integration Guide

This guide covers the Neon database integration for the document paraphrasing service.

## Overview

The application now uses Neon PostgreSQL for persistent storage:
- **Documents**: Stores uploaded files and extracted text
- **Jobs**: Tracks paraphrasing job status and progress
- **Results**: Stores completed paraphrasing results

## Architecture Changes

### Before (Streaming)
1. Upload file → Extract text → Stream processing → Real-time updates
2. No persistence, progress lost on refresh

### After (Database-backed)
1. Upload file → Store in DB → Create job → Return job ID
2. Background processing updates job status in DB
3. Frontend polls job status every 2 seconds
4. Results persisted and retrievable anytime

## Database Schema

### Tables

**documents**
- `id` - Serial primary key
- `document_id` - UUID, unique identifier
- `filename` - Original filename
- `file_type` - Extension (pdf, docx, txt)
- `file_size` - Size in bytes
- `content` - Extracted text content
- `created_at` - Timestamp

**paraphrase_jobs**
- `id` - Serial primary key
- `job_id` - UUID, unique identifier
- `document_id` - Reference to document
- `status` - pending, processing, completed, failed
- `progress` - 0-100
- `current_chunk` - Current chunk being processed
- `total_chunks` - Total chunks to process
- `config` - JSON with paraphrase settings (tone, formality, etc.)
- `error` - Error message if failed
- `created_at` - Timestamp
- `updated_at` - Timestamp

**paraphrase_results**
- `id` - Serial primary key
- `job_id` - Reference to job
- `result` - Complete paraphrased text
- `created_at` - Timestamp

## Environment Setup

### Required Environment Variables

Create `.env.local`:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_AqZ65bKglEmR@ep-spring-credit-ahcseq0d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### For Vercel Deployment

Add these environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon connection string
3. Add `OPENROUTER_API_KEY` with your OpenRouter API key

## Installation

```bash
# Install dependencies
npm install

# Push schema to Neon database
npm run db:push

# Start development server
npm run dev
```

## Available Database Commands

```bash
# Generate migrations (if you change schema)
npm run db:generate

# Push schema directly to database (fastest for dev)
npm run db:push

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## API Endpoints

### POST /api/paraphrase
Upload and queue a document for paraphrasing.

**Request:**
```
FormData:
  - file: File (pdf, docx, txt)
  - config: JSON string with paraphrase settings
```

**Response:**
```json
{
  "jobId": "uuid",
  "documentId": "uuid",
  "totalChunks": 20,
  "status": "pending"
}
```

### GET /api/jobs/[jobId]
Check job status and get results.

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing",
  "progress": 45,
  "currentChunk": 9,
  "totalChunks": 20,
  "error": null,
  "result": null,
  "createdAt": "2025-10-30T14:00:00Z",
  "updatedAt": "2025-10-30T14:01:30Z"
}
```

When completed:
```json
{
  "jobId": "uuid",
  "status": "completed",
  "progress": 100,
  "currentChunk": 20,
  "totalChunks": 20,
  "error": null,
  "result": "Full paraphrased text...",
  "createdAt": "2025-10-30T14:00:00Z",
  "updatedAt": "2025-10-30T14:05:00Z"
}
```

## Frontend Changes

The React frontend now:
1. Uploads file and receives job ID
2. Polls `/api/jobs/[jobId]` every 2 seconds
3. Updates progress bar from database values
4. Displays result when status becomes "completed"
5. Shows error if status becomes "failed"

**Key differences:**
- No more streaming responses
- Progress persists across page refreshes (if you save job ID)
- Multiple users can check same job status
- Results stored permanently in database

## Neon Database Management

### Connecting via psql

```bash
psql 'postgresql://neondb_owner:npg_AqZ65bKglEmR@ep-spring-credit-ahcseq0d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

### Useful SQL Queries

```sql
-- Check recent jobs
SELECT job_id, status, progress, created_at 
FROM paraphrase_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Get job details with document info
SELECT 
  j.job_id,
  j.status,
  j.progress,
  d.filename,
  d.file_type
FROM paraphrase_jobs j
JOIN documents d ON j.document_id = d.document_id
WHERE j.status = 'processing';

-- Clean up old jobs (optional)
DELETE FROM paraphrase_results WHERE job_id IN (
  SELECT job_id FROM paraphrase_jobs WHERE created_at < NOW() - INTERVAL '7 days'
);
DELETE FROM paraphrase_jobs WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM documents WHERE created_at < NOW() - INTERVAL '7 days';
```

## Performance Considerations

### Vercel Function Timeout
- Default: 10 seconds (Hobby)
- Current setting: 300 seconds (5 minutes) via `maxDuration`
- Pro plan: 15 minutes max
- Enterprise: 900 seconds max

### Database Connections
- Neon pooler handles connection management
- Using `@neondatabase/serverless` for optimal serverless compatibility
- HTTP-based queries (no persistent connections)

### Polling Strategy
- 2-second intervals balance responsiveness vs. database load
- Consider WebSockets for real-time updates in production
- Could implement exponential backoff for failed jobs

## Troubleshooting

### "password authentication failed"
- Verify `DATABASE_URL` has correct format with `c-3` region
- Check connection string includes `?sslmode=require`

### "Job stays in pending state"
- Background processing might have failed
- Check Vercel function logs
- Verify `OPENROUTER_API_KEY` is set

### "Database connection timeout"
- Neon may have auto-suspended (free tier sleeps after inactivity)
- First query after sleep takes ~1-2 seconds to wake
- Consider upgrading to paid tier for always-on

### Development vs. Production
- Local dev: Uses `.env.local`
- Vercel: Uses environment variables from dashboard
- Make sure to sync both when changing keys

## Migration from Streaming Version

If you have an existing deployment:

1. Add `DATABASE_URL` to Vercel environment variables
2. Run `npm run db:push` locally to create tables
3. Deploy updated code
4. Old in-progress jobs will be lost (no migration needed)

## Future Enhancements

Potential improvements:
- [ ] Add job expiration/cleanup cron
- [ ] Implement WebSocket for real-time updates
- [ ] Add user authentication and job ownership
- [ ] Store file uploads in Vercel Blob instead of database text
- [ ] Add job history page
- [ ] Implement job cancellation
- [ ] Add retry logic for failed chunks
- [ ] Export job results in multiple formats

## Security Notes

- Connection string contains credentials - keep `.env.local` out of git
- Consider using Vercel's environment variable encryption
- Neon supports IP allowlisting for production databases
- All connections use SSL by default
- No SQL injection risk (using Drizzle ORM parameterized queries)

## Support

For issues:
- Check Vercel function logs: `vercel logs`
- Check Neon dashboard for connection issues
- Review database with: `npm run db:studio`
