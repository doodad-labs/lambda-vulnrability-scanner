

// Get Server/Software version from response headers
async function detectFromHeader(headers: Headers) {
    try {
        
        const techHeaders = [
            ['Server', 'Server {} was leaked, this could lead to exploiting known vulnerabilities.'], 
            ['X-Powered-By', 'X-Powered-By {} was leaked, this could lead to exploiting known vulnerabilities.'], 
            ['X-AspNet-Version', 'X-AspNet-Version {} was leaked, this could lead to exploiting known vulnerabilities.'],
            ['X-Backend-Server', 'X-Backend-Server {} was leaked, this could lead to exploiting known vulnerabilities.'], 
            ['X-Generator', 'X-Generator {} was leaked, this could lead to exploiting known vulnerabilities.'],
            ['X-Varnish', 'X-Varnish {} was leaked, this could lead to exploiting known vulnerabilities.'], 
            ['X-Served-By', 'X-Served-By {} was leaked, this could lead to exploiting known vulnerabilities.']
        ];

        let found: boolean = false;
        let messages: string[] = [];

        techHeaders.forEach(header => {
            const value = headers.get(header[0]);
            if (value) {
                found = true;
                messages.push(header[1].replace('{}', value));
            }
        });

        return { found, messages };
    } catch (error) {
        return { found: false, messages: [] };
    }
}

export default async function(url: URL, body: string, headers: Headers) {
    let found: boolean = false;
    let messages: string[] = [];

    const results = await Promise.allSettled([
        detectFromHeader(headers)
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