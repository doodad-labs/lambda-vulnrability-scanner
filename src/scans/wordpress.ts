import fetch from "../utils/fetch";
import { IndividualScanResult } from '../types/scans'

type WordPressPathCheck = {
    path: string;
    expectedStatus: number;
    expectedBodyContent: string | null;
    message: string;
};

/**
 * Common WordPress paths to check with their expected responses
 */
const WORDPRESS_PATH_CHECKS: WordPressPathCheck[] = [
    {
        path: '/wp-login.php',
        expectedStatus: 200,
        expectedBodyContent: '<select name="wp_lang" id="language-switcher-locales">',
        message: 'WordPress login page detected at /wp-login.php - consider changing this path'
    },
    {
        path: '/wp-admin',
        expectedStatus: 200,
        expectedBodyContent: '<select name="wp_lang" id="language-switcher-locales">',
        message: 'WordPress admin panel detected at /wp-admin - consider changing this path'
    },
    {
        path: '/wp-content',
        expectedStatus: 200,
        expectedBodyContent: null,
        message: 'WordPress content directory exposed at /wp-content - consider restricting access'
    },
    {
        path: '/wp-includes',
        expectedStatus: 403,
        expectedBodyContent: "You don't have permission to access this resource.",
        message: 'WordPress includes directory detected at /wp-includes'
    },
    {
        path: '/xmlrpc.php',
        expectedStatus: 405,
        expectedBodyContent: 'XML-RPC server accepts POST requests only.',
        message: 'XML-RPC interface enabled at /xmlrpc.php - consider disabling for security'
    }
];

/**
 * Detects WordPress presence and common security issues
 */
export default async function detectWordPress(
    url: URL,
    pageContent: string
): Promise<IndividualScanResult> {
    const bodyDetection = detectFromPageContent(pageContent);
    const pathChecks = await checkWordPressPaths(url);

    return compileWordPressResults(bodyDetection, pathChecks);
}

/**
 * Checks HTML content for WordPress signatures
 */
function detectFromPageContent(html: string): { found: boolean; message: string | null } {
    const wordPressSignatures = ['wp-content', 'wp-includes', 'wp-json', 'wp-'];
    const found = wordPressSignatures.some(signature => html.includes(signature));

    return {
        found,
        message: found ? 'WordPress signatures detected in page content' : null
    };
}

/**
 * Tests common WordPress paths for exposure
 */
async function checkWordPressPaths(url: URL): Promise<{ found: boolean; messages: string[] }> {
    const checkResults = await Promise.allSettled(
        WORDPRESS_PATH_CHECKS.map(check => testWordPressPath(url, check))
    );

    const results = {
        found: false,
        messages: [] as string[]
    };

    checkResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.found) {
            results.found = true;
            results.messages.push(WORDPRESS_PATH_CHECKS[index].message);
        }
    });

    return results;
}

/**
 * Tests a single WordPress path against expected responses
 */
async function testWordPressPath(
    baseUrl: URL,
    check: WordPressPathCheck
): Promise<{ found: boolean }> {
    try {
        const testUrl = new URL(check.path, baseUrl);
        const response = await fetch(testUrl.href);

        if (response.status !== check.expectedStatus) {
            return { found: false };
        }

        if (check.expectedBodyContent) {
            const responseText = await response.text();
            return { found: responseText.includes(check.expectedBodyContent) };
        }

        return { found: true };
    } catch (error) {
        console.error(`Error testing WordPress path ${check.path}:`, error);
        return { found: false };
    }
}

/**
 * Compiles all WordPress detection results
 */
function compileWordPressResults(
    bodyDetection: { found: boolean; message: string | null },
    pathChecks: { found: boolean; messages: string[] }
): IndividualScanResult {
    const allMessages = [
        ...(bodyDetection.found && bodyDetection.message ? [bodyDetection.message] : []),
        ...pathChecks.messages
    ];

    return {
        found: bodyDetection.found || pathChecks.found,
        messages: allMessages.length > 0 ? allMessages : ['No WordPress vulnerabilities detected']
    };
}