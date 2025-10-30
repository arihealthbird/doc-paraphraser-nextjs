# Vercel Deployment Notes

## ⚠️ Important: Function Timeout Limits

Vercel has different timeout limits based on your plan:

| Plan | Max Function Duration |
|------|----------------------|
| **Hobby (Free)** | 10 seconds |
| **Pro** | 60 seconds (configurable up to 300s) |
| **Enterprise** | Custom |

### Current Configuration

The `/api/paraphrase` route is set to `maxDuration = 60` seconds, which **requires a Pro plan**.

**For Hobby (Free) Plan Users:**
- Maximum processing time: **10 seconds**
- This limits document size to ~50-100 pages
- Larger documents will timeout

### Options for Large Documents on Free Plan

**Option 1: Upgrade to Pro Plan**
- Cost: $20/month
- Allows 60-300 second timeouts
- Can process 700+ page documents

**Option 2: Process Smaller Documents**
- Keep documents under 50-100 pages
- Works fine on free tier

**Option 3: Self-Host**
- Deploy to your own server (no timeout limits)
- Use Railway, Render, or any Node.js host
- Will need to bring back the original Express version

## Current Deployment Status

✅ App is deployed and working
⚠️ Large documents may timeout on Hobby plan

## To Enable 60s Timeout

1. Go to your Vercel dashboard
2. Upgrade to Pro plan ($20/month)
3. The `maxDuration = 60` in the code will then work
4. Can process documents up to ~300-400 pages

## Environment Variables Required

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```
OPENROUTER_API_KEY = your_api_key_here
```

## Testing

**Small documents (works on free tier):**
- ✅ 1-50 pages: Should work fine
- ⚠️ 50-100 pages: May timeout occasionally
- ❌ 100+ pages: Will timeout on Hobby plan

**With Pro plan:**
- ✅ 1-400 pages: Should work fine
- ⚠️ 400-700 pages: May work (depends on complexity)
- ❌ 700+ pages: Consider chunking or self-hosting
