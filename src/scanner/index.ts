import wordpress from "./tests/wordpress";
import filetraversal from './tests/filetraversal'
import usageleak from "./tests/usageleak";
import outdated from "./tests/outdated";
import httpupgrade from "./tests/httpupgrade";

import fetch from "../utils/fetch";

// Severity: minor, moderate, high, critical
// minor: Low impact (e.g., information disclosure)
// moderate: Medium impact (e.g., CSRF, XSS)
// high: High impact (e.g., SQLI)
// critical: Critical impact (e.g., RCE, File Traversal)

// Function, Name, Severity
const tests: {
    name: string;
    func: (url: URL, body: string, headers: Headers) => Promise<{ found: boolean; messages: string[] }>;
    severity: 'info' | 'minor' | 'moderate' | 'high' | 'critical';
}[] = [
    {
        "name": 'WordPress Detection',
        "func": wordpress,
        "severity": "minor"
    },
    {
        "name": 'File Traversal',
        "func": filetraversal,
        "severity": "critical"
    },
    {
        "name": 'Software Usage Leaks',
        "func": usageleak,
        "severity": "info"
    },
    {
        "name": 'Outdated Software',
        "func": outdated,
        "severity": "moderate"
    },
    {
        "name": 'HTTP Upgrade',
        "func": httpupgrade,
        "severity": "high"
    }
]

export default async function(url: URL) {

    // get body and headers so that the tests that only need the body or headers dont make redundant requests
    const [body, headers] = await fetch(url.origin).then(res => {
        return Promise.all([res.text(), res.headers]);
    }).catch(err => [null, null]);

    if (!body || !headers) {
        console.error('Failed to retrieve body or headers:', { body, headers });
        return [];
    }

    const results = await Promise.allSettled(
        tests.map(test => test.func(url, body, headers))
    );

    return results.map((result, index) => {
        return {
            name: tests[index].name,
            severity: tests[index].severity,
            success: result.status === 'fulfilled', 
            found: result.status === 'fulfilled' ? result.value.found : false,
            messages: result.status === 'fulfilled' ? result.value.messages : 'No vulnerabilities found',
        }
    })
}