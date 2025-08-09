"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wordpress_js_1 = __importDefault(require("./tests/wordpress.js"));
const filetraversal_js_1 = __importDefault(require("./tests/filetraversal.js"));
const usageleak_js_1 = __importDefault(require("./tests/usageleak.js"));
const outdated_js_1 = __importDefault(require("./tests/outdated.js"));
// Severity: minor, moderate, high, critical
// minor: Low impact (e.g., information disclosure)
// moderate: Medium impact (e.g., CSRF, XSS)
// high: High impact (e.g., SQLI)
// critical: Critical impact (e.g., RCE, File Traversal)
// Function, Name, Severity
const tests = [
    {
        "name": 'WordPress Detection',
        "func": wordpress_js_1.default,
        "severity": "minor"
    },
    {
        "name": 'File Traversal',
        "func": filetraversal_js_1.default,
        "severity": "critical"
    },
    {
        "name": 'Software Usage Leaks',
        "func": usageleak_js_1.default,
        "severity": "moderate"
    },
    {
        "name": 'Outdated Software',
        "func": outdated_js_1.default,
        "severity": "moderate"
    }
];
async function default_1(url) {
    const results = await Promise.allSettled(tests.map(test => test.func(url)));
    return results.map((result, index) => {
        return {
            name: tests[index].name,
            severity: tests[index].severity,
            success: result.status === 'fulfilled',
            found: result.status === 'fulfilled' ? result.value.found : false,
            messages: result.status === 'fulfilled' ? result.value.messages : 'No vulnerabilities found',
        };
    });
}
exports.default = default_1;
