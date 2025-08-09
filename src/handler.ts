import scanner from './scanner';
import Event from './types/events';
import { VulnerabilityResult } from './types/scans';

//const SCAN_RESULTS_SUBMISSION_URL = 'https://doodadlabs.org/scan/submit';
const SCAN_RESULTS_SUBMISSION_URL = 'http://localhost:5173/scan/submit';

export const scan = async (event: Event) => {

  // Validate and parse the input URL
  let targetUrl;
  try {
    targetUrl = new URL(event.url);
  } catch (error) {
    console.error('Invalid URL provided:', event.url, error);
    return submitFailureReport({
      email: event.email,
      url: event.url,
      error: 'There was an error processing your request.',
    });
  }

  // Check if the website is reachable
  const isWebsiteReachable = await checkWebsiteAvailability(targetUrl.origin);
  if (!isWebsiteReachable) {
    console.error('Website is not reachable:', targetUrl.origin);
    return submitFailureReport({
      email: event.email,
      url: event.url,
      error: 'Your website was not reachable, please check if it is online. If you\'re using a firewall, please temporarily disable it.',
    });
  }

  // Perform the scan
  const start = performance.now();
  const scanResults = await scanner(targetUrl);
  const duration = performance.now() - start;

  console.log(`Scan completed in ${duration.toFixed(2)}ms`);
  console.log(scanResults)

  // Submit the results
  await submitScanResults({
    email: event.email,
    url: targetUrl.origin,
    results: scanResults,
    elapsed: duration,
  });
};

/**
 * Checks if a website is available by sending a HEAD request
 */
async function checkWebsiteAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Website availability check failed:', error);
    return false;
  }
}

/**
 * Submits scan results to the server
 */
async function submitScanResults(data: {
  email: string;
  url: string;
  results: VulnerabilityResult[];
  elapsed: number;
}) {
  try {
    await fetch(SCAN_RESULTS_SUBMISSION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to submit scan results:', error);
  }
}

async function submitFailureReport(data: {
  email: string;
  url: string;
  error: string;
}) {
  try {
    await fetch(SCAN_RESULTS_SUBMISSION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Failed to submit failure report:', error);
  }
}