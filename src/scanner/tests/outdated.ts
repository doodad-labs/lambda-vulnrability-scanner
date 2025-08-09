import fetch from "../../utils/fetch";

async function jquery(body: string) {
    try {
        let found = false;
        let messages = [];

        // detect any script tags with the "jquery" within the src
        const scriptRegex = /<script\b[^>]*src=["']([^"']*)["'][^>]*>/gi;
        const jqueryLinks = [];
        let match;
        
        // Common jQuery core filename patterns
        const jqueryCorePattern = /(^|\/)(jquery|jquery\.min)(-[0-9.]+)?(\.min)?\.js($|\?|#)/i;
        
        while ((match = scriptRegex.exec(body)) !== null) {
            const src = match[1];
            // Check if src matches jQuery core file pattern
            if (jqueryCorePattern.test(src)) {
                jqueryLinks.push(src);
            }
        }

        jqueryLinks.splice(5);

        const versionResults = await Promise.allSettled(
            jqueryLinks.map(async (src) => {
                const scriptContent = await fetch(src).then(res => res.text()).catch(()=>null);
                if (!scriptContent) {
                    return []
                }

                let versions = new Set();

                // Try to extract from header comment first
                const headerCommentRegex = /\/\*! jQuery v([0-9.]+) \|/;
                const headerMatch = scriptContent.match(headerCommentRegex);
                if (headerMatch && headerMatch[1]) {
                    versions.add(headerMatch[1]);
                }

                // If not found in header, look for version variable in code
                const versionVarRegex = /var [a-zA-Z0-9]="([0-9.]+)"/;
                const versionVarMatch = scriptContent.match(versionVarRegex);
                if (versionVarMatch && versionVarMatch[1]) {
                    versions.add(versionVarMatch[1]);
                }

                // Alternative pattern for newer versions
                const altVersionRegex = /jQuery\.extend\(\{[^}]*version:"([0-9.]+)"/;
                const altMatch = scriptContent.match(altVersionRegex);
                if (altMatch && altMatch[1]) {
                    versions.add(altMatch[1]);
                }

                return [...versions];

            })
        );

        const currentVersion = await fetch(`https://registry.npmjs.org/jquery/latest`).then(res => res.json()).then(data => data.version).catch(() => null);
        const versions = versionResults.filter((v) => v.status === 'fulfilled').flatMap((v) => v.status === 'fulfilled' ? v.value : []);
        const outdated = versions.filter(v => v !== currentVersion);

        if (outdated.length > 0) {
            found = true;
            messages.push(`The following jQuery versions are outdated: ${outdated.join(', ')}`);
        }

        return { found, messages };
    } catch (error) {
        console.log(error)
        return { found: false, messages: [] };
    }
}

async function lodash(body: string) {
    try {
        let found = false;
        let messages = [];

        // detect any script tags with the "lodash" within the src
        const scriptRegex = /<script\b[^>]*src=["']([^"']*)["'][^>]*>/gi;
        const lodashLinks = [];
        let match;
        
        // Common lodash core filename patterns
        const lodashCorePattern = /(^|\/)(lodash|lodash\.min)(-[0-9.]+)?(\.min)?\.js($|\?|#)/i;
        
        while ((match = scriptRegex.exec(body)) !== null) {
            const src = match[1];
            // Check if src matches lodash core file pattern
            if (lodashCorePattern.test(src)) {
                lodashLinks.push(src);
            }
        }

        lodashLinks.splice(5);

        const versionResults = await Promise.allSettled(
            lodashLinks.map(async (src) => {
                const scriptContent = await fetch(src).then(res => res.text()).catch(()=>null);
                if (!scriptContent) {
                    return []
                }

                let versions = new Set();

                // Try to extract from header comment first
                const headerCommentRegex = /ash\s+([0-9.]+)/;
                const headerMatch = scriptContent.match(headerCommentRegex);
                if (headerMatch && headerMatch[1]) {
                    versions.add(headerMatch[1]);
                }

                // If not found in header, look for version variable in code
                const versionVarRegex = /="([0-9.]+)"/;
                const versionVarMatch = scriptContent.match(versionVarRegex);
                if (versionVarMatch && versionVarMatch[1]) {
                    versions.add(versionVarMatch[1]);
                }

                return [...versions];

            })
        );

        const currentVersion = await fetch(`https://registry.npmjs.org/lodash/latest`).then(res => res.json()).then(data => data.version).catch(() => null);
        const versions = versionResults.filter((v) => v.status === 'fulfilled').flatMap((v) => v.status === 'fulfilled' ? v.value : []);
        const outdated = versions.filter(v => v !== currentVersion);

        if (outdated.length > 0) {
            found = true;
            messages.push(`The following Lodash versions are outdated: ${outdated.join(', ')}`);
        }

        return { found, messages };
    } catch (error) {
        console.log(error)
        return { found: false, messages: [] };
    }
}

export default async function(url: URL, body: string) {
    let found: boolean = false;
    let messages: string[] = [];

    const results = await Promise.allSettled([
        jquery(body),
        lodash(body)
    ]);

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            found = found || result.value.found;
            messages = messages.concat(result.value.messages);
        }
    });

    // Return results
    return {
        found: found,
        messages: messages.length > 0 ? messages : ['No vulnerabilities found']
    }
}