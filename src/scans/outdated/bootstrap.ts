import fetch from "../../utils/fetch";

type DetectionResult = {
    found: boolean;
    messages: string[];
};

type VersionCheckResult = {
    outdatedVersions: string[];
    currentVersion: string | null;
};

/**
 * Detects outdated Bootstrap versions in HTML content
 */
export default async function detectOutdatedBootstrap(
    htmlContent: string
): Promise<DetectionResult> {
    try {
        const bootstrapScriptUrls = findBootstrapScripts(htmlContent);
        const detectedVersions = await getBootstrapVersions(bootstrapScriptUrls);
        const versionCheck = await checkVersionsAgainstLatest(detectedVersions);

        return formatResults(versionCheck);
    } catch (error) {
        console.error('Bootstrap detection error:', error);
        return { found: false, messages: [] };
    }
}

/**
 * Finds Bootstrap script tags in HTML content
 */
function findBootstrapScripts(html: string): string[] {
    const scriptRegex = /<script\b[^>]*src=["']([^"']*)["'][^>]*>/gi;
    const bootstrapPattern = /(^|\/)(bootstrap|bootstrap\.min|bootstrap\.esm)(-[0-9.]+)?(\.min)?\.js($|\?|#)/i;
    const matches: string[] = [];
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
        if (bootstrapPattern.test(match[1])) {
            matches.push(match[1]);
        }
    }

    // Limit to first 5 matches to avoid excessive checks
    return matches.slice(0, 5);
}

/**
 * Extracts Bootstrap versions from script files
 */
async function getBootstrapVersions(urls: string[]): Promise<Set<string>> {
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
 * Extracts version numbers from Bootstrap script content
 */
function extractVersionsFromScript(content: string): Set<string> {
    const versions = new Set<string>();

    // Check header comment format (specific to Bootstrap)
    const headerCommentMatch = content.match(/strap\sv+([0-9.]+)/i);
    if (headerCommentMatch?.[1]) versions.add(headerCommentMatch[1]);

    // Check version variable format
    const versionVarMatch = content.match(/"([0-9.]+)"}/);
    if (versionVarMatch?.[1]) versions.add(versionVarMatch[1]);

    return versions;
}

/**
 * Checks detected versions against latest npm version
 */
async function checkVersionsAgainstLatest(
    detectedVersions: Set<string>
): Promise<VersionCheckResult> {
    try {
        const latestVersion = await fetchLatestBootstrapVersion();
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
 * Fetches latest Bootstrap version from npm registry
 */
async function fetchLatestBootstrapVersion(): Promise<string | null> {
    try {
        const response = await fetch('https://registry.npmjs.org/bootstrap/latest');
        const data = await response.json();
        return data.version;
    } catch {
        return null;
    }
}

/**
 * Formats the final detection results
 */
function formatResults(check: VersionCheckResult): DetectionResult {
    if (check.outdatedVersions.length === 0) {
        return {
            found: false,
            messages: ['No outdated Bootstrap versions detected']
        };
    }

    return {
        found: true,
        messages: [
            `Outdated Bootstrap versions detected: ${check.outdatedVersions.join(', ')}. Latest: ${check.currentVersion}`
        ]
    };
}