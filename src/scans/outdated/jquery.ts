import fetch from "../../utils/fetch";
import { IndividualScanResult } from '../../types/scans'

type VersionCheckResult = {
    outdatedVersions: string[];
    currentVersion: string | null;
};

/**
 * Detects outdated jQuery versions in HTML content
 */
export default async function detectOutdatedJQuery(
    htmlContent: string
): Promise<IndividualScanResult> {
    try {
        const jqueryScriptUrls = findJQueryScripts(htmlContent);
        const detectedVersions = await getJQueryVersions(jqueryScriptUrls);
        const versionCheck = await checkVersionsAgainstLatest(detectedVersions);

        return formatResults(versionCheck);
    } catch (error) {
        console.error('jQuery detection error:', error);
        return { found: false, messages: [] };
    }
}

/**
 * Finds jQuery script tags in HTML content
 */
function findJQueryScripts(html: string): string[] {
    const scriptRegex = /<script\b[^>]*src=["']([^"']*)["'][^>]*>/gi;
    const jqueryPattern = /(^|\/)(jquery|jquery\.min)(-[0-9.]+)?(\.min)?\.js($|\?|#)/i;
    const matches: string[] = [];
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
        if (jqueryPattern.test(match[1])) {
            matches.push(match[1]);
        }
    }

    // Limit to first 5 matches to avoid excessive checks
    return matches.slice(0, 5);
}

/**
 * Extracts jQuery versions from script files
 */
async function getJQueryVersions(urls: string[]): Promise<Set<string>> {
    const versionResults = await Promise.allSettled(
        urls.map(async (url) => {
            try {
                const content = await fetch(url).then(res => res.text());
                return extractVersionsFromScript(content);
            } catch {
                return new Set<string>();
            }
        })
    );

    const versions = new Set<string>();
    versionResults.forEach(result => {
        if (result.status === 'fulfilled') {
            result.value.forEach(v => versions.add(v));
        }
    });

    return versions;
}

/**
 * Extracts version numbers from jQuery script content
 */
function extractVersionsFromScript(content: string): Set<string> {
    const versions = new Set<string>();

    // Check header comment format
    const headerCommentMatch = content.match(/\/\*! jQuery v([0-9.]+) \|/);
    if (headerCommentMatch?.[1]) versions.add(headerCommentMatch[1]);

    // Check version variable format
    const versionVarMatch = content.match(/var [a-zA-Z0-9]="([0-9.]+)"/);
    if (versionVarMatch?.[1]) versions.add(versionVarMatch[1]);

    // Check newer version format
    const extendFormatMatch = content.match(/jQuery\.extend\(\{[^}]*version:"([0-9.]+)"/);
    if (extendFormatMatch?.[1]) versions.add(extendFormatMatch[1]);

    return versions;
}

/**
 * Checks detected versions against latest npm version
 */
async function checkVersionsAgainstLatest(
    detectedVersions: Set<string>
): Promise<VersionCheckResult> {
    try {
        const latestVersion = await fetchLatestJQueryVersion();
        const outdated = latestVersion
            ? [...detectedVersions].filter(v => v !== latestVersion)
            : [];

        return {
            outdatedVersions: outdated,
            currentVersion: latestVersion
        };
    } catch {
        return {
            outdatedVersions: [],
            currentVersion: null
        };
    }
}

/**
 * Fetches latest jQuery version from npm registry
 */
async function fetchLatestJQueryVersion(): Promise<string | null> {
    try {
        const response = await fetch('https://registry.npmjs.org/jquery/latest');
        const data = await response.json();
        return data.version;
    } catch {
        return null;
    }
}

/**
 * Formats the final detection results
 */
function formatResults(check: VersionCheckResult): IndividualScanResult {
    if (check.outdatedVersions.length === 0) {
        return {
            found: false,
            messages: ['No outdated jQuery versions detected']
        };
    }

    return {
        found: true,
        messages: [
            `Outdated jQuery versions detected: ${check.outdatedVersions.join(', ')}. Latest: ${check.currentVersion}`
        ]
    };
}