// Input contract for direct invocation
interface RequestPayload {
  url?: string;
  email?: string;
  timeoutMs?: number; // optional custom timeout (capped)
}

function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function fetchWithTimeout(resource: string, timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(resource, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Fire-and-forget style: Promise<void>, rely on async invocation (InvocationType: Event)
export const handler = async (event: RequestPayload): Promise<void> => {
  const startAll = Date.now();
  try {
    const url = event.url?.trim();
    const email = event.email?.trim();
    const timeoutMs = event.timeoutMs && event.timeoutMs > 0 ? Math.min(event.timeoutMs, 30000) : 8000;

    assert(url, 'Missing required field: url');
    assert(email, 'Missing required field: email');

    let parsed: URL;
    try {
      parsed = new URL(url!);
      assert(['http:', 'https:'].includes(parsed.protocol), 'URL must use http or https');
    } catch (e: any) {
      throw new Error(`Invalid URL: ${e.message}`);
    }

    const fetchStart = Date.now();
    const response = await fetchWithTimeout(parsed.toString(), timeoutMs);
    const duration = Date.now() - fetchStart;
    const textSample = await response.text().catch(() => '')
      .then(t => t.slice(0, 300));

    console.log(JSON.stringify({
      level: 'info',
      message: 'FetchComplete',
      email,
      url: parsed.toString(),
      status: response.status,
      ok: response.ok,
      durationMs: duration,
      totalHandlerMs: Date.now() - startAll,
      bodySnippet: textSample,
      truncated: textSample.length === 300
    }));
  } catch (err: any) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'FetchFailed',
      error: err.message,
      stack: err.stack,
      event,
      totalHandlerMs: Date.now() - startAll
    }));
    throw err; // ensure Lambda marks failure for DLQ / retries if configured
  }
};
