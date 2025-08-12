import fetch from "../utils/fetch";
import { IndividualScanResult } from '../types/scans'

/**
 * Common file paths to test for
 */
const CONFIG_FILE_PATTERNS: string[] = [
    "/.aws/config",
    "/aws/credentials",
    "/.travis.yml",
    "/admin/config",
    "/api/config/config.yml",
    "/main.yml",
    "/aws.yml",
    "/.env",
    "/phpinfo",
    "/phpinfo.php",
    "/portal/.env",
    "/env/.env",
    "/api/.env",
    "/app/.env",
    "/dev/.env",
    "/new/.env",
    "/new/.env.local",
    "/new/.env.production",
    "/new/.env.staging",
    "/_phpinfo.php",
    "/_profiler/phpinfo",
    "/_profiler/phpinfo/info.php",
    "/_profiler/phpinfo/phpinfo.php",
    "/wp-config",
    "/aws-secret.yaml",
    "/awstats/.env",
    "/conf/.env",
    "/cron/.env",
    "/www/.env",
    "/docker/.env",
    "/docker/app/.env",
    "/env.backup",
    "/xampp/phpinfo.php",
    "/lara/info.php",
    "/lara/phpinfo.php",
    "/laravel/info.php",
    "/.vscode/.env",
    "/js/.env",
    "/laravel/.env",
    "/laravel/core/.env",
    "/mail/.env",
    "/mailer/.env",
    "/nginx/.env",
    "/public/.env",
    "/site/.env",
    "/xampp/.env",
    "/main/.env",
    "/node_modules/.env",
    "/kyc/.env",
    "/admin/.env",
    "/prod/.env",
    "/.env.bak",
    "/api/shared/config/config.env",
    "/api/shared/config.env",
    "/config.env",
    "/website/.env",
    "/development/.env",
    "/backend/.env",
    "/api/shared/config/.env",
    "/api/shared/.env",
    "/api/config.env",
    "/service/email_service.py",
    "/node/.env_example",
    "/.env.production.local",
    "/.env.local",
    "/.env.example",
    "/.env.stage",
    "/server/config/database.js",
    "/.env.old",
    "/.env_sample",
    "/scripts/nodemailer.js",
    "/.env.prod",
    "/crm/.env",
    "/local/.env",
    "/core/.env",
    "/apps/.env",
    "/config.js"
];

/**
 * Scans for config files by testing various path patterns
 * @param url The target URL to test against
 * @returns Object containing detection results and messages
 */
export default async function detectConfigFile(url: URL): Promise<IndividualScanResult> {
    const testResults = await testPathPatterns(url);
    return compileResults(testResults);
}

/**
 * Tests all config file patterns against the target URL
 */
async function testPathPatterns(url: URL): Promise<PromiseSettledResult<boolean>[]> {
    return Promise.allSettled(
        CONFIG_FILE_PATTERNS.map(async (path) => {
            const response = await fetch(`${url.origin}${path}`);
            return response.status === 200;
        })
    );
}

/**
 * Compiles test results into a final detection report
 */
function compileResults(
    results: PromiseSettledResult<boolean>[]
): IndividualScanResult {
    let vulnerabilityFound = false;
    const detectionMessages: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            vulnerabilityFound = true;
            detectionMessages.push(
                `Potential exposed config file detected at: ${CONFIG_FILE_PATTERNS[index]}`
            );
        }
    });

    return {
        found: vulnerabilityFound,
        messages: detectionMessages.length > 0
            ? detectionMessages
            : ['No exposed configs detected']
    };
}