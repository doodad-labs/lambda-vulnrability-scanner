import { ScanResult } from "./types/scans";
import fetch from "./utils/fetch";

import wordpress from "./scans/wordpress";
import filetraversal from './scans/filetraversal';
import usageleak from "./scans/usageleak";
import outdated from "./scans/outdated";
import httpupgrade from "./scans/httpupgrade";

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
    func: (url: URL, body: string, headers: Headers) => Promise<ScanResult>;
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
    }
];

/**
 * Executes all configured security scans against a target URL
 * @param url The target URL to scan
 * @returns Array of scan results with severity and findings
 */
export default async function runSecurityScans(url: URL) {
    // Fetch target resources once to avoid redundant requests
    const [body, headers] = await fetchTargetResources(url);
    if (!body || !headers) {
        console.error('Failed to retrieve target resources', { url: url.origin });
        return [];
    }

    // Execute all scans in parallel
    const scanResults = await executeAllScans(url, body, headers);

    return formatResults(scanResults);
}

/**
 * Fetches the target website's body content and headers
 */
async function fetchTargetResources(url: URL): Promise<[string | null, Headers | null]> {
    try {
        const response = await fetch(url.origin);
        return await Promise.all([response.text(), response.headers]);
    } catch (error) {
        console.error('Resource fetch failed:', error);
        return [null, null];
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
): Array<{
    name: string;
    severity: string;
    success: boolean;
    found: boolean;
    messages: string[] | string;
}> {
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