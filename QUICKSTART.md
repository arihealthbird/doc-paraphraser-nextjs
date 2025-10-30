# Quick Start Guide

Get your document paraphraser running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenRouter API key ([get one here](https://openrouter.ai/))
- The Neon database is already set up and connected

## Setup

### Option 1: Automated Setup (Recommended)

```bash
./setup.sh
```

This will:
- Install all npm dependencies
- Create `.env.local` with database connection
- Push database schema to Neon

Then just:
1. Edit `.env.local` and add your `OPENROUTER_API_KEY`
2. Run `npm run dev`
3. Visit http://localhost:3000

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cat > .env.local << EOF
DATABASE_URL=postgresql://neondb_owner:npg_AqZ65bKglEmR@ep-spring-credit-ahcseq0d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=your_key_here
EOF

# 3. Push database schema
npm run db:push

# 4. Start development server
npm run dev
```

## Usage

1. **Open** http://localhost:3000
2. **Select** a document (PDF, DOCX, or TXT)
3. **Choose** an AI model (Claude 3.5 Sonnet recommended)
4. **Configure** tone, formality, and creativity
5. **Click** "Paraphrase Document"
6. **Wait** for processing (progress bar shows status)
7. **Download** your result as TXT

## Features

- ✅ **10+ AI Models**: Claude, GPT-4, Gemini, DeepSeek, and more
- ✅ **Job Persistence**: Progress saved in database, survives page refresh
- ✅ **Smart Chunking**: Handles large documents (up to 4MB)
- ✅ **Real-time Progress**: Updates every 2 seconds
- ✅ **Custom Settings**: Control tone, formality, and creativity
- ✅ **Download Results**: Export as TXT file

## Architecture

**Upload Flow:**
```
File Upload → Text Extraction → Store in DB → Create Job → Return Job ID
```

**Processing Flow:**
```
Background Worker → Chunk Text → Paraphrase Each Chunk → Update Progress → Store Result
```

**Polling Flow:**
```
Frontend → Poll /api/jobs/[jobId] every 2s → Update UI → Show Result
```

## Database

Your Neon database has 3 tables:

- **documents**: Uploaded files and extracted text
- **paraphrase_jobs**: Job status and progress tracking
- **paraphrase_results**: Completed paraphrased text

View them in real-time:
```bash
npm run db:studio
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Don't forget to add environment variables in Vercel dashboard:
- `DATABASE_URL` (already configured)
- `OPENROUTER_API_KEY` (your key)

## Troubleshooting

**"Job stays in pending state"**
- Check if OPENROUTER_API_KEY is set correctly
- Look at terminal logs for errors

**"Database connection error"**
- Neon free tier may auto-suspend after inactivity
- First query after sleep takes 1-2 seconds
- Check connection string in .env.local

**"File too large"**
- Maximum 4MB for uploads (Vercel limit)
- For larger files, contact support

## Commands Reference

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Run production build
npm run lint       # Lint code
npm run db:push    # Sync schema to database
npm run db:studio  # Open database GUI
```

## Learn More

- [Full Documentation](./README-NEON.md) - Complete setup and API docs
- [WARP Guide](./WARP.md) - Architecture and development guide
- [OpenRouter Docs](https://openrouter.ai/docs) - AI model documentation
- [Neon Docs](https://neon.tech/docs) - Database documentation

## Support

Issues? Questions?
- Check [README-NEON.md](./README-NEON.md) for detailed troubleshooting
- Review Vercel logs: `vercel logs <deployment-url>`
- Inspect database: `npm run db:studio`

Happy paraphrasing! 🎉
