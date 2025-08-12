import scanner from './scanner';
import Event from './types/events';
import { ScanResult } from './types/scans';

const SCAN_RESULTS_SUBMISSION_URL = 'https://doodadlabs.org/scan/submit';
//const SCAN_RESULTS_SUBMISSION_URL = 'http://localhost:5173/scan/submit';

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

  const email = event.email;
  let linked = false;

  // Check if the email domain matches the target URL's hostname (Allows for more intense scans)
  if (email) {
    const emailDomain = email.split('@')[1];
    if (emailDomain) {
      const emailRootDomain = getRootDomain(emailDomain);
      const targetRootDomain = getRootDomain(targetUrl.hostname);
      if (emailRootDomain === targetRootDomain) {
        linked = true;
      }
    }
  }

  // Perform the scan
  const start = performance.now();
  const { result, error } = await scanner(targetUrl, linked).catch((error) => {
    console.error('Scan failed:', error);
    return {
      result: [],
      error: 'There was an error processing your request.',
    };
  });
  const duration = performance.now() - start;

  console.log(`Scan completed in ${duration.toFixed(2)}ms`);
  console.log(result)

  if (!result || error) {
    console.error('Scan did not return valid results');
    return submitFailureReport({
      email: event.email,
      url: event.url,
      error: error ?? 'There was an error processing your request.',
    });
  }

  // Submit the results
  await submitScanResults({
    email: event.email,
    url: targetUrl.origin,
    results: result,
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

/* 
 * Extracts the root domain from a hostname
 */
function getRootDomain(hostname: string) {
  // Remove www. if present
  const domain = hostname.replace(/^www\./, '');
  // Split by dots and get the last two parts (for most cases)
  const parts = domain.split('.');
  // Handle cases like co.uk (two-part TLDs)
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  return domain;
}

/**
 * Submits scan results to the server
 */
async function submitScanResults(data: {
  email: string;
  url: string;
  results: ScanResult[];
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