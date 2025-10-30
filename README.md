# Document Paraphraser Service

AI-powered document paraphrasing with 10+ advanced language models. Built with Next.js 14, Neon PostgreSQL, and OpenRouter API.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/arihealthbird/doc-paraphraser-nextjs)

## 🚀 Quick Start

```bash
# Automated setup (recommended)
./setup.sh

# Add your OpenRouter API key to .env.local
# Then start the dev server
npm run dev
```

Visit http://localhost:3000 to start paraphrasing!

👉 **[Full Quick Start Guide →](./QUICKSTART.md)**

## ✨ Features

- **10+ AI Models**: Claude 3.5 Sonnet, GPT-4 Turbo, Gemini Pro, DeepSeek, and more
- **Job Persistence**: Progress saved in database, survives page refresh
- **Smart Processing**: Handles large documents with intelligent chunking
- **Real-time Updates**: Progress bar updates every 2 seconds via polling
- **Customizable**: Control tone, formality, and creativity levels
- **Export Ready**: Download results as TXT files

## 🏗️ Architecture

**Stack:**
- **Framework**: Next.js 14 with App Router
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **AI**: OpenRouter (access to 100+ models)
- **Deployment**: Vercel-optimized

**Flow:**
```
Upload → Extract Text → Store in DB → Create Job → Background Processing → Poll Status → Show Result
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_AqZ65bKglEmR@ep-spring-credit-ahcseq0d-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
OPENROUTER_API_KEY=your_api_key_here
```

Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/).

### 2.5. Push Database Schema

```bash
npm run db:push
```

This creates the necessary tables in Neon PostgreSQL.

### 3. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment to Vercel

### Option 1: GitHub + Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/doc-paraphraser.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variable: `OPENROUTER_API_KEY`
   - Click "Deploy"

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

When prompted:
- Set project name
- Add environment variable when asked

### Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL = postgresql://...
OPENROUTER_API_KEY = your_key_here
```

## 🔗 API Endpoints

- `POST /api/paraphrase` - Upload document and create job
- `GET /api/jobs/[jobId]` - Check job status and retrieve results
- `GET /api/health` - Health check

👉 **[Full API Documentation →](./README-NEON.md#api-endpoints)**

## 📖 Usage

1. **Open** http://localhost:3000
2. **Select** a document (PDF, DOCX, or TXT)
3. **Choose** an AI model (Claude 3.5 Sonnet recommended)
4. **Configure** tone, formality, and creativity
5. **Click** "Paraphrase Document"
6. **Wait** for processing (progress bar shows status)
7. **Download** your result as TXT

## Configuration Options

- **Tone**: Formal, Neutral, Casual
- **Formality**: High, Medium, Low
- **Creativity**: Conservative, Moderate, Creative
- **Preserve Formatting**: Keep original structure

## 🗄️ Database

**Neon PostgreSQL** stores:
- **documents**: Uploaded files and extracted text
- **paraphrase_jobs**: Job status and progress tracking
- **paraphrase_results**: Completed paraphrased text

View database:
```bash
npm run db:studio
```

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Neon Integration Guide](./README-NEON.md)** - Database setup and API details
- **[WARP Development Guide](./WARP.md)** - Architecture and development reference

## ⚠️ Limitations

- **Timeout**: 5-minute serverless function limit (Vercel Pro: 15 minutes)
- **File Size**: Maximum 4MB (Vercel limit)
- **Polling**: 2-second intervals
- **Output Format**: Always TXT (regardless of input)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: OpenRouter API (Claude 3.5 Sonnet)
- **Document Processing**: pdf-parse, mammoth
- **Deployment**: Vercel

## 📦 Project Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── paraphrase/route.ts    # Upload & job creation
│   │   │   ├── jobs/[jobId]/route.ts  # Status polling endpoint
│   │   │   └── health/route.ts        # Health check
│   │   ├── page.tsx                   # Main UI
│   │   └── layout.tsx                 # App layout
│   └── lib/
│       ├── engine.ts                  # Paraphrasing engine
│       ├── openrouter.ts              # AI API client
│       ├── chunker.ts                 # Text chunking
│       └── extractor.ts               # Document extraction
├── lib/
│   └── db/
│       ├── client.ts                  # Neon connection
│       ├── schema.ts                  # Database schema
│       └── service.ts                 # Database operations
├── drizzle.config.ts                  # Drizzle ORM config
├── .env.local                         # Environment variables
└── vercel.json                        # Vercel config
```

## 🛠️ Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code
npm run db:push      # Sync database schema
npm run db:studio    # Open database GUI
```

## 🐛 Troubleshooting

**Job stuck in pending?**
- Verify `OPENROUTER_API_KEY` is set
- Check terminal/Vercel logs for errors

**Database connection issues?**
- Neon free tier auto-suspends after inactivity
- First query wakes database (1-2 seconds)

**File upload fails?**
- Maximum 4MB file size (Vercel limit)
- Supported formats: PDF, DOCX, TXT

👉 **[Full Troubleshooting Guide →](./README-NEON.md#troubleshooting)**

## 💰 Cost Estimate

Based on OpenRouter pricing for Claude 3.5 Sonnet:
- ~$0.03 per 10,000 words paraphrased
- 700-page document (~175,000 words) ≈ $0.50

## 🤝 Contributing

This is a private project, but suggestions welcome!

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai) - AI model access
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Vercel](https://vercel.com) - Deployment platform
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM

---

**Built with ❤️ by Nick's Document System**

For detailed setup and API documentation, see [README-NEON.md](./README-NEON.md)
# Force rebuild Thu Oct 30 16:10:53 EDT 2025
