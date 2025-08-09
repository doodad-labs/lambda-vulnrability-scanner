import fetch from "../utils/fetch";
import { ScanResult} from '../types/scans';

/**
 * Checks if a website properly redirects HTTP requests to HTTPS
 * @param url The target URL to test (HTTPS version)
 * @returns Object containing detection results and messages
 */
export default async function checkHttpUpgrade(url: URL): Promise<ScanResult> {
    const httpUrl = createHttpVersion(url);
    const upgradeRequired = await testHttpUpgrade(httpUrl);

    return formatUpgradeResults(upgradeRequired);
}

/**
 * Creates an HTTP version of the given HTTPS URL
 */
function createHttpVersion(httpsUrl: URL): URL {
    const httpUrl = new URL(httpsUrl.origin);
    httpUrl.protocol = 'http:';
    return httpUrl;
}

/**
 * Tests if the website fails to redirect from HTTP to HTTPS
 * @returns true if upgrade is needed (vulnerability found), false if secure
 */
async function testHttpUpgrade(httpUrl: URL): Promise<boolean> {
    try {
        const response = await fetch(httpUrl.origin, { method: 'HEAD' });
        return response.url.startsWith('http://');
    } catch (error) {
        console.error('HTTP upgrade test failed:', error);
        return false;
    }
}

/**
 * Formats the test results into a standardized response
 */
function formatUpgradeResults(upgradeRequired: boolean): ScanResult {
    if (upgradeRequired) {
        return {
            found: true,
            messages: ['Security vulnerability: HTTP requests are not redirected to HTTPS']
        };
    }

    return {
        found: false,
        messages: ['No HTTP upgrade issues detected']
    };
}