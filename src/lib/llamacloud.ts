export class LlamaCloudService {
  private readonly apiKey: string;
  private readonly uploadUrl = 'https://api.cloud.llamaindex.ai/api/v1/parsing/upload';
  private readonly jobBaseUrl = 'https://api.cloud.llamaindex.ai/api/v1/parsing/job';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.LLAMACLOUD_API_KEY ?? '';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getMimeType(filename: string): string {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  async parseDocument(buffer: Buffer, filename: string): Promise<string> {
    console.log(`[LlamaCloud] Starting parse for ${filename}, buffer size: ${buffer.length}`);
    
    if (!this.apiKey) {
      throw new Error('LLAMACLOUD_API_KEY is not set');
    }

    // Convert Buffer to ArrayBuffer for Blob compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: this.getMimeType(filename) });
    const form = new FormData();
    form.append('file', blob, filename);
    
    // Required parameters (exact as requested)
    form.append('parse_mode', 'parse_page_with_agent');
    form.append('model', 'openai-gpt-4-1-mini');
    form.append('high_res_ocr', 'true');
    form.append('adaptive_long_table', 'true');
    form.append('outlined_table_extraction', 'true');
    form.append('output_tables_as_HTML', 'true');

    let uploadResp: Response;
    try {
      console.log('[LlamaCloud] Uploading file...');
      uploadResp = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`,
          'accept': 'application/json'
        },
        body: form,
      });
    } catch (e: any) {
      console.error('[LlamaCloud] Upload request failed:', e);
      throw new Error(`Failed to reach LlamaCloud upload endpoint: ${e?.message || e}`);
    }

    if (!uploadResp.ok) {
      const errText = await uploadResp.text();
      console.error(`[LlamaCloud] Upload failed (${uploadResp.status}):`, errText);
      throw new Error(`LlamaCloud upload failed (${uploadResp.status}): ${errText}`);
    }

    const uploadJson: any = await uploadResp.json();
    const jobId: string | undefined = uploadJson?.id;
    
    if (!jobId) {
      console.error('[LlamaCloud] No job ID in response:', uploadJson);
      throw new Error('LlamaCloud upload response missing job id');
    }

    console.log(`[LlamaCloud] File uploaded, job ID: ${jobId}, polling for result...`);

    const intervalMs = 5000;
    const timeoutMs = 240000; // 4 minutes (fits within Vercel 5-min limit)
    const deadline = Date.now() + timeoutMs;

    // Poll for result
    while (Date.now() < deadline) {
      await this.sleep(intervalMs);

      let res: Response;
      try {
        res = await fetch(`${this.jobBaseUrl}/${jobId}/result/markdown`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${this.apiKey}`,
            'accept': 'application/json'
          },
        });
      } catch (e) {
        console.warn('[LlamaCloud] Polling request failed, will retry:', e);
        // Transient network error; continue polling until timeout
        continue;
      }

      if (res.ok) {
        const data = await res.json();
        const md = data?.markdown ?? data?.result ?? data?.data?.markdown;
        
        if (!md) {
          console.error('[LlamaCloud] No markdown in response:', data);
          throw new Error('LlamaCloud returned no markdown content');
        }
        
        console.log(`[LlamaCloud] Parse completed, markdown length: ${md.length}`);
        return md as string;
      }

      if (res.status === 400) {
        // Expected while processing
        try {
          const err = await res.json();
          if (err?.detail === 'Job not completed yet') {
            console.log('[LlamaCloud] Job still processing...');
            continue;
          }
          console.error('[LlamaCloud] Job error:', err);
          throw new Error(`LlamaCloud job error: ${JSON.stringify(err)}`);
        } catch (e) {
          // If JSON parse fails, continue polling
          continue;
        }
      }

      if (res.status === 404) {
        console.warn('[LlamaCloud] Job not found (404), will retry...');
        // Briefly continue in case of propagation delay
        continue;
      }

      const errText = await res.text();
      console.error(`[LlamaCloud] Unexpected status ${res.status}:`, errText);
      throw new Error(`Error checking LlamaCloud job (${res.status}): ${errText}`);
    }

    console.error('[LlamaCloud] Job timed out after 4 minutes');
    throw new Error('LlamaCloud parse job timed out');
  }
}

export const llamaCloud = new LlamaCloudService();
