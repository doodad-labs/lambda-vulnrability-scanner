const originalFetch: typeof globalThis.fetch = globalThis.fetch;

export const requests: string[] = [];

export default async function fetch(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {

  requests.push(input.toString());

  const timeout = init?.timeout ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = new Headers(init?.headers || {});
  headers.set('x-scanner', 'Security Scan by Doodadlabs, if you did\'nt request this scan, please report abuse at https://doodadlabs.com/scan/abuse');

  try {
    const response = await originalFetch(input, {
      ...init,
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }

    throw error;
  }
}