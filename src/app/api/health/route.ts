import { NextResponse } from 'next/server';

export async function GET() {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    apiConfigured: hasApiKey,
    timestamp: new Date().toISOString(),
  });
}
