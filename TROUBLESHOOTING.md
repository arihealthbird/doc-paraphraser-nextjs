# Troubleshooting "Unexpected end of JSON input" Error

## Problem
You're seeing an "unexpected end of JSON input" error when trying to upload a file.

## Root Cause
This error occurs when:
1. The API key is not configured
2. The server returns an empty or non-JSON response
3. Network issues prevent the response from completing

## Solution Steps

### 1. Set Your OpenRouter API Key

**Option A: Update .env.local (Local Development)**

Edit `.env.local` and replace the placeholder with your actual API key:

```bash
# Open the file
nano .env.local

# Or use VS Code
code .env.local
```

Change this:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

To this (with your real key):
```
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_KEY_HERE
```

**Get an API Key:**
1. Go to https://openrouter.ai/
2. Sign up or log in
3. Go to "Keys" in the dashboard
4. Create a new API key
5. Copy and paste it into `.env.local`

**Option B: Set as Environment Variable**

```bash
export OPENROUTER_API_KEY="sk-or-v1-YOUR_ACTUAL_KEY_HERE"
npm run dev
```

### 2. Restart the Development Server

After setting the API key:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 3. Test the API

Open your browser to http://localhost:3000 and try uploading the included `test.txt` file.

## Verification

### Check if API key is loaded:

```bash
# In your terminal where you run npm run dev, you should NOT see:
# "OPENROUTER_API_KEY not configured properly"
```

### Test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "message": "Paraphrase API is running",
  "methods": ["POST"],
  "version": "2.0.0-db"
}
```

### Test the paraphrase endpoint info:

```bash
curl http://localhost:3000/api/paraphrase
```

Should return API info (not an error).

## Common Issues

### "API key not configured"
✅ Solution: Set `OPENROUTER_API_KEY` in `.env.local`

### "Failed to fetch job status (404)"
✅ Solution: Make sure database tables are created with `npm run db:push`

### "Database connection error"
✅ Solution: Check that `DATABASE_URL` is set in `.env.local`

### Still getting JSON errors?

1. **Check browser console** (F12 → Console tab)
   - Look for the actual error message
   - Check network tab for failed requests

2. **Check server logs**
   - Look at the terminal where `npm run dev` is running
   - Look for error messages in red

3. **Try the test file**
   ```bash
   # Upload test.txt through the web interface
   # It's a small file that should process quickly
   ```

## Debug Mode

Add console logging to see what's happening:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading a file
4. Watch for:
   - "POST /api/paraphrase called"
   - Any error messages
   - Network requests in the Network tab

## Expected Flow

When working correctly:

1. Upload file → Returns `{"jobId": "...", "status": "pending"}`
2. Poll job status → Returns `{"status": "processing", "progress": 25}`
3. Keep polling → Progress increases
4. Final poll → Returns `{"status": "completed", "result": "..."}`

## Still Having Issues?

1. Check that all dependencies are installed:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Rebuild the app:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

3. Check database connection:
   ```bash
   npm run db:studio
   ```

4. Review environment variables:
   ```bash
   cat .env.local
   # Make sure both DATABASE_URL and OPENROUTER_API_KEY are set
   ```

## Quick Test Command

```bash
# Test upload with curl (replace with your actual API key in .env.local first)
curl -X POST http://localhost:3000/api/paraphrase \
  -F "file=@test.txt" \
  -F 'config={"tone":"neutral","formality":"medium","creativity":"moderate"}'
```

Should return:
```json
{
  "jobId": "some-uuid",
  "documentId": "some-uuid",
  "totalChunks": 1,
  "status": "pending"
}
```

Then check job status:
```bash
curl http://localhost:3000/api/jobs/YOUR_JOB_ID_HERE
```
