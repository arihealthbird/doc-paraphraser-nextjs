# WARP.md - Next.js Version

This file provides guidance to WARP (warp.dev) when working with the Next.js version of this repository.

## Project Overview

Document paraphrasing service rebuilt as a Next.js 14 application using OpenRouter API for paraphrasing and LlamaCloud LlamaParse API for advanced document parsing (PDF/DOCX). Uses Neon PostgreSQL for persistent storage of documents, jobs, and results. Deployable on Vercel.

## Essential Commands

### Development
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run Next.js linter
npm run db:push      # Push database schema to Neon
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Deployment
```bash
vercel               # Deploy to Vercel (requires CLI)
git push origin main # Auto-deploy if connected to Vercel
```

## Architecture (Next.js Version)

### Key Changes from Express Version
- **Neon PostgreSQL**: Persistent storage for documents, jobs, and results
- **Job-based processing**: Upload returns job ID, frontend polls for status
- **Background processing**: Jobs run async, progress tracked in database
- **No file uploads folder**: Files processed in-memory from FormData
- **Serverless-first**: Designed for Vercel's 5-minute function limit

### Request Flow
1. **Upload** → Client sends FormData with file to `/api/paraphrase`
2. **Extract** → Buffer converted to text via DocumentExtractor:
   - **PDF/DOCX**: Parsed by LlamaCloud LlamaParse API (returns markdown with HTML tables)
   - **TXT**: Direct buffer.toString('utf-8') conversion
3. **Store** → Document saved to Neon database (markdown format for PDF/DOCX)
4. **Create Job** → Job record created, returns jobId immediately
5. **Background Process** → ParaphrasingEngine runs async, updates job progress in DB
6. **Poll** → Client polls `/api/jobs/[jobId]` every 2 seconds for status
7. **Complete** → Result stored in DB, frontend displays when status = 'completed'

### Service Layer Pattern

**Core Libraries (lib/):**
- `openrouter.ts` - Direct fetch-based API client (no OpenAI SDK dependency)
- `engine.ts` - Streaming paraphrasing orchestrator (AsyncGenerator)
- `chunker.ts` - Text chunking with overlap
- `extractor.ts` - Document extraction from Buffer (uses LlamaCloud for PDF/DOCX)
- `llamacloud.ts` - LlamaCloud LlamaParse API client (upload + polling)
- `db/client.ts` - Neon database connection (@neondatabase/serverless)
- `db/schema.ts` - Drizzle ORM schema (documents, jobs, results)
- `db/service.ts` - Database operations (createDocument, createJob, etc.)

**API Routes (app/api/):**
- `/api/paraphrase/route.ts` - Upload endpoint
  - `maxDuration: 300` (5 minutes for large docs)
  - Stores document and creates job
  - Returns job ID immediately
  - Background processing updates DB
- `/api/jobs/[jobId]/route.ts` - Job status endpoint
  - Returns current status, progress, and result
- `/api/health/route.ts` - Health check

### Database Schema

**documents** - Stores uploaded files and extracted text
- `document_id` (UUID), `filename`, `file_type`, `file_size`, `content`, `created_at`

**paraphrase_jobs** - Tracks job status and progress
- `job_id` (UUID), `document_id`, `status` (pending/processing/completed/failed)
- `progress` (0-100), `current_chunk`, `total_chunks`, `config` (JSON), `error`, `created_at`, `updated_at`

**paraphrase_results** - Stores completed results
- `job_id` (UUID), `result` (text), `created_at`

### Frontend (app/page.tsx)

Single-page React component with:
- File upload (PDF/DOCX/TXT validation)
- Configuration form (tone, formality, creativity, AI model selection)
- Progress bar with chunk counter
- Result preview with download button
- Job-based polling (every 2 seconds) instead of streaming
- Progress persists across page refreshes

## File Structure

```
nextjs-src/
├── app/
│   ├── api/
│   │   ├── paraphrase/route.ts    # Streaming paraphrase endpoint
│   │   └── health/route.ts        # Health check
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main UI component
│   └── globals.css                # Tailwind directives
├── lib/
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── openrouter.ts              # OpenRouter API client (fetch-based)
│   ├── engine.ts                  # Paraphrasing engine (AsyncGenerator)
│   ├── chunker.ts                 # Text chunking utility
│   └── extractor.ts               # Document text extraction
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json                    # Vercel function config
```

## Environment Variables

Required:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API key for paraphrasing
- `LLAMACLOUD_API_KEY` - LlamaCloud API key for PDF/DOCX parsing (not required for TXT files)

Set in `.env.local` for local dev or Vercel dashboard for production.

### LlamaCloud Configuration
PDF and DOCX files are parsed using LlamaCloud's LlamaParse API with these defaults:
- `parse_mode: "parse_page_with_agent"` (uses GPT-4-mini internally)
- `high_res_ocr: true` (slower but more accurate for scanned documents)
- `adaptive_long_table: true` (handles multi-page tables)
- `outlined_table_extraction: true` (extracts table structures)
- `output_tables_as_HTML: true` (tables preserved as HTML in markdown)

Parsing takes 5-30 seconds per document depending on complexity. The system polls every 5 seconds with a 4-minute timeout.

## Vercel Deployment

### First-time Setup
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add OPENROUTER_API_KEY when asked
```

### Subsequent Deploys
- Push to GitHub (if connected) → auto-deploy
- Or run `vercel` in project directory

### Vercel Configuration (vercel.json)
```json
{
  "functions": {
    "app/api/paraphrase/route.ts": {
      "maxDuration": 300
    }
  }
}
```

## Known Limitations

- **Timeout**: 5-minute max (Vercel Pro allows 15 minutes)
- **Memory**: 1GB default (may fail on extremely large PDFs)
- **Output**: Always TXT format
- **Database Storage**: Large documents stored as text in database (consider Vercel Blob for files >1MB)
- **Polling**: 2-second intervals (consider WebSockets for production)

## Prompt Engineering

Same as Express version—see `lib/openrouter.ts`:
- System prompt in `buildSystemPrompt()`
- Tone/formality/creativity mappings unchanged
- Temperature: 0.3 (conservative), 0.6 (moderate), 0.9 (creative)

## Markdown Formatting

All documents are processed and stored as markdown:
- **PDF/DOCX**: LlamaCloud extracts as clean markdown with HTML tables
- **Paraphrasing**: AI explicitly instructed to preserve markdown structure while rewriting content
- **Display**: react-markdown + remark-gfm renders with Tailwind Typography (@tailwindcss/typography)
- **Downloads**: 
  - PDF: Rendered with styled headings (H1: 24pt, H2: 18pt, etc.), bold/italic fonts, and bullet lists
  - DOCX: Converted to Word styles (HeadingLevel.HEADING_1, bold TextRuns, bullet paragraphs, tables)
  - TXT: Remains as readable markdown plaintext

Dependencies: `react-markdown`, `remark-gfm`, `@tailwindcss/typography`, `marked`

### Markdown Preservation Flow
1. **Extraction**: LlamaCloud outputs markdown (headings as `#`, lists as `-`, tables as HTML)
2. **AI Instruction**: System prompt includes CRITICAL rules to preserve all markdown syntax
3. **Frontend**: ReactMarkdown component renders with custom styling for headings, lists, tables
4. **Download**: marked.lexer() parses tokens → generator.ts maps to PDF/DOCX primitives

## Chunking & Overlap

Same logic as Express version—see `lib/chunker.ts`:
- 4000 char max, 200 char overlap
- Sentence-boundary splitting when possible
- Overlap removal in `engine.ts` via last 3 sentences comparison

## Debugging

### Local Development
```bash
npm run dev
# Check browser console for streaming updates
# Check terminal for server-side logs
```

### Vercel Logs
```bash
vercel logs <deployment-url>
```

Or view in Vercel Dashboard → Deployments → Logs

## When Modifying

- **Paraphrasing logic**: Edit `lib/engine.ts` and `lib/openrouter.ts`
- **UI**: Edit `app/page.tsx`
- **API behavior**: Edit `app/api/paraphrase/route.ts`
- **Styling**: Tailwind classes in components or `app/globals.css`

## Migration Notes

If migrating back to Express/BullMQ:
- Core logic (engine, chunker, extractor, openrouter) is identical
- Just restore worker pattern from `src/workers/paraphrasingWorker.ts`
- Replace streaming with job status polling
