const originalFetch: typeof globalThis.fetch = globalThis.fetch;

export default async function fetch(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {
  // Default timeout of 2 seconds (2000ms)
  const timeout = init?.timeout ?? 2000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await originalFetch(input, {
      ...init,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      console.error(`Fetch timed out after ${timeout}ms`);
      throw new Error(`Request timed out after ${timeout}ms`);
    }

    console.error('Fetch failed:', error);
    throw error;
  }
}