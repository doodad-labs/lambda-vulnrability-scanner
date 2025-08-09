import wordpress from "./tests/wordpress.js";
import filetraversal from './tests/filetraversal.js'
import usageleak from "./tests/usageleak.js";
import outdated from "./tests/outdated.js";

// Severity: minor, moderate, high, critical
// minor: Low impact (e.g., information disclosure)
// moderate: Medium impact (e.g., CSRF, XSS)
// high: High impact (e.g., SQLI)
// critical: Critical impact (e.g., RCE, File Traversal)

// Function, Name, Severity
const tests: {
    name: string;
    func: (url: URL) => Promise<{ found: boolean; messages: string[] }>;
    severity: 'minor' | 'moderate' | 'high' | 'critical';
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
        "severity": "moderate"
    },
    {
        "name": 'Outdated Software',
        "func": outdated,
        "severity": "moderate"
    }
]

export default async function(url: URL) {

    const results = await Promise.allSettled(
        tests.map(test => test.func(url))
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