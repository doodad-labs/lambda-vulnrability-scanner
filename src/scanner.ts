import { ScanResult, VulnerabilityResult } from "./types/scans";
import fetch from "./utils/fetch";

import wordpress from "./scans/wordpress";
import filetraversal from './scans/filetraversal';
import usageleak from "./scans/usageleak";
import outdated from "./scans/outdated";
import httpupgrade from "./scans/httpupgrade";
import emailDetector from "./scans/emaildetector";

/**
 * Vulnerability severity levels:
 * - info: Informational finding (no direct risk)
 * - minor: Low impact (e.g., information disclosure)
 * - moderate: Medium impact (e.g., CSRF, XSS)
 * - high: High impact (e.g., SQL injection)
 * - critical: Critical impact (e.g., RCE, File Traversal)
 */

type ScanDefinition = {
    name: string;
    func: (url: URL, body: string, headers: Headers) => Promise<ScanResult> | ScanResult;
    severity: 'info' | 'minor' | 'moderate' | 'high' | 'critical';
};

// Configure all available security scans
const SCAN_CONFIGURATIONS: ScanDefinition[] = [
    {
        name: 'WordPress Detection',
        func: wordpress,
        severity: 'minor'
    },
    {
        name: 'File Traversal',
        func: filetraversal,
        severity: 'critical'
    },
    {
        name: 'Software Usage Leaks',
        func: usageleak,
        severity: 'info'
    },
    {
        name: 'Outdated Software',
        func: outdated,
        severity: 'moderate'
    },
    {
        name: 'HTTP Upgrade',
        func: httpupgrade,
        severity: 'high'
    },
    {
        name: 'Email Address Detection',
        func: emailDetector,
        severity: 'minor'
    }
];

/**
 * Executes all configured security scans against a target URL
 * @param url The target URL to scan
 * @returns Array of scan results with severity and findings
 */
export default async function runSecurityScans(url: URL): Promise<{result: VulnerabilityResult[], error: string | null}> {
    // Fetch target resources once to avoid redundant requests
    const [body, headers, redirected] = await fetchTargetResources(url);

    // If the URL was redirected to a different domain, log a warning
    if (redirected) {
        console.warn(`Warning: URL redirected to a different domain: ${url.origin}`);
        return {
            result: [],
            error: 'URL redirected to a different domain'
        }
    }

    if (!body || !headers) {
        console.error('Failed to retrieve target resources', { url: url.origin });
        return {
            result: [],
            error: 'Failed to retrieve target resources'
        };
    }

    // Execute all scans in parallel
    const scanResults = await executeAllScans(url, body, headers).catch(error => {
        console.error('Error executing scans:', error);
        return null;
    });

    if (!scanResults) {
        return {
            result: [],
            error: 'Error executing scans'
        };
    }

    return {
        result: formatResults(scanResults),
        error: null
    };
}

/**
 * Fetches the target website's body content and headers
 */
async function fetchTargetResources(url: URL): Promise<[string | null, Headers | null, boolean]> {
    try {
        const response = await fetch(url.origin);

        // test if the url is being redirected to a different domain (ignore www subdomain)
        const responseUrl = new URL(response.url);
        if (responseUrl.origin !== url.origin && responseUrl.hostname.replace(/^www\./, '') !== url.hostname.replace(/^www\./, '')) {
            console.warn(`Warning: URL redirected to a different domain: ${responseUrl.href}`);
            return [null, null, true];
        }

        return await Promise.all([response.text(), response.headers, false]);
    } catch (error) {
        console.error('Resource fetch failed:', error);
        return [null, null, true];
    }
}

/**
 * Executes all configured scans against the target
 */
async function executeAllScans(
    url: URL,
    body: string,
    headers: Headers
): Promise<PromiseSettledResult<ScanResult>[]> {
    return Promise.allSettled(
        SCAN_CONFIGURATIONS.map(scan => scan.func(url, body, headers))
    );
}

/**
 * Formats raw scan results with additional metadata
 */
function formatResults(
    results: PromiseSettledResult<ScanResult>[]
): VulnerabilityResult[] {
    return results.map((result, index) => ({
        name: SCAN_CONFIGURATIONS[index].name,
        severity: SCAN_CONFIGURATIONS[index].severity,
        success: result.status === 'fulfilled',
        found: result.status === 'fulfilled' ? result.value.found : false,
        messages: result.status === 'fulfilled'
            ? result.value.messages
            : ['Scan failed: No vulnerabilities found'],
    }));
}