import { ScanResult } from '../types/scans'

type HeaderCheck = {
    name: string;
    warningMessage: string;
};

/**
 * Configuration of security-sensitive headers to check
 */
const SECURITY_HEADERS_TO_CHECK: HeaderCheck[] = [
    {
        name: 'Server',
        warningMessage: 'Server header "{}" was leaked, potentially exposing server version information'
    },
    {
        name: 'X-Powered-By',
        warningMessage: 'X-Powered-By header "{}" was leaked, potentially exposing backend technology'
    },
    {
        name: 'X-AspNet-Version',
        warningMessage: 'X-AspNet-Version header "{}" was leaked, exposing ASP.NET version details'
    },
    {
        name: 'X-Backend-Server',
        warningMessage: 'X-Backend-Server header "{}" was leaked, exposing backend infrastructure'
    },
    {
        name: 'X-Generator',
        warningMessage: 'X-Generator header "{}" was leaked, exposing CMS/framework information'
    },
    {
        name: 'X-Varnish',
        warningMessage: 'X-Varnish header "{}" was leaked, exposing caching infrastructure'
    },
    {
        name: 'X-Served-By',
        warningMessage: 'X-Served-By header "{}" was leaked, exposing server identification'
    }
];

/**
 * Scans for information leakage in HTTP headers
 */
export default async function detectUsageLeak(
    url: URL,
    body: string,
    headers: Headers
): Promise<ScanResult> {
    const headerResults = checkSecurityHeaders(headers);
    return compileDetectionResults([headerResults]);
}

/**
 * Checks for sensitive information in HTTP headers
 */
function checkSecurityHeaders(headers: Headers): ScanResult {
    try {
        let vulnerabilitiesFound = false;
        const vulnerabilityMessages: string[] = [];

        SECURITY_HEADERS_TO_CHECK.forEach(({ name, warningMessage }) => {
            const headerValue = headers.get(name);
            if (headerValue) {
                vulnerabilitiesFound = true;
                vulnerabilityMessages.push(warningMessage.replace('{}', headerValue));
            }
        });

        return {
            found: vulnerabilitiesFound,
            messages: vulnerabilityMessages
        };
    } catch (error) {
        console.error('Error checking security headers:', error);
        return { found: false, messages: [] };
    }
}

/**
 * Compiles multiple detection results into a single report
 */
function compileDetectionResults(
    results: ScanResult[]
): ScanResult {
    const combinedResult: ScanResult = {
        found: false,
        messages: []
    };

    results.forEach(result => {
        if (result.found) {
            combinedResult.found = true;
            combinedResult.messages.push(...result.messages);
        }
    });

    if (!combinedResult.found) {
        combinedResult.messages.push('No information leakage vulnerabilities detected in headers');
    }

    return combinedResult;
}