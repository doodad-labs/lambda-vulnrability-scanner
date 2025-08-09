import wordpress from "./tests/wordpress.mjs";
import filetraversal from './tests/filetraversal.mjs'
import usageleak from "./tests/usageleak.mjs";
import outdated from "./tests/outdated.mjs";

// Severity: minor, moderate, high, critical
// minor: Low impact (e.g., information disclosure)
// moderate: Medium impact (e.g., CSRF, XSS)
// high: High impact (e.g., SQLI)
// critical: Critical impact (e.g., RCE, File Traversal)

// Function, Name, Severity
const tests = [
    [wordpress, 'WordPress Detection', 'minor'],
    [filetraversal, 'File Traversal', 'critical'],
    [usageleak, 'Software Usage Leaks', 'moderate'],
    [outdated, 'Outdated Software', 'moderate']
]

export default async function(url) {

    const results = await Promise.allSettled(
        tests.map(([test, _]) => test(url))
    );

    return results.map((result, index) => {
        return {
            name: tests[index][1],
            severity: tests[index][2],
            success: result.status === 'fulfilled',
            found: result.value.found,
            messages: result.value.messages || 'No messages',
        }
    })
}