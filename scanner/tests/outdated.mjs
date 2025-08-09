async function jquery(url) {
    try {
        const response = await fetch(url);
        let found = false;
        let messages = [];

        // is html response
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('text/html')) {
            return { found: false, messages: [] };
        }

        const body = await response.text();

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
        const versions = versionResults.filter((v) => v.status === 'fulfilled').flatMap((v) => v.value);
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

export default async function(url) {
    let found = false;
    let messages = []

    const results = await Promise.allSettled([
        jquery(url.origin)
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