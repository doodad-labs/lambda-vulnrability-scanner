"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Get Server/Software version from response headers
async function detectFromHeader(url) {
    try {
        const response = await fetch(url);
        const headers = response.headers;
        const techHeaders = [
            'Server', 'X-Powered-By', 'X-AspNet-Version',
            'X-Backend-Server', 'X-Generator',
            'X-Varnish', 'X-Served-By'
        ];
        let found = false;
        let messages = [];
        techHeaders.forEach(header => {
            const value = headers.get(header);
            if (value) {
                found = true;
                messages.push(`Found ${header}: ${value}`);
            }
        });
        return { found, messages };
    }
    catch (error) {
        return { found: false, messages: [] };
    }
}
async function default_1(url) {
    let found = false;
    let messages = [];
    const results = await Promise.allSettled([
        detectFromHeader(url)
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
    };
}
exports.default = default_1;
