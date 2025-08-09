// Array of WordPress-related paths to fuzz with expected responses and messages
const urlFuzzing = [
    // Each entry contains: path, expected status code, expected response body snippet, and message
    ['/wp-login.php', 200, '<select name="wp_lang" id="language-switcher-locales">', 'Consider changing your /wp-login path'],
    ['/wp-admin', 200, '<select name="wp_lang" id="language-switcher-locales">', 'Consider changing your /wp-admin path'],
    ['/wp-content', 200, null, 'Consider changing your /wp-content path'],
    ['/wp-includes', 403, 'You don\'t have permission to access this resource.', 'Found /wp-includes path'],
    ['/xmlrpc.php', 405, 'XML-RPC server accepts POST requests only.', 'XML-RPC is enabled, consider disabling it'],
]

/**
 * Detects WordPress presence by checking the response body for common WordPress patterns
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Returns true if WordPress patterns are found in the body
 */
async function detectFromBody(url) {
    try {
        // Fetch the URL content
        const response = await fetch(url);
        const html = await response.text();

        // Check for common WordPress patterns in the HTML
        if (html.includes('wp-content') || 
            html.includes('wp-includes') ||
            html.includes('wp-json') || 
            html.includes('wp-')) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error fetching the URL:', error.message);
        return false;
    }
}

/**
 * Main function to detect WordPress vulnerabilities
 * @param {string} url - The base URL to test
 * @returns {Promise<Object>} - Returns an object with detection results and messages
 */
export default async function(url) {
    // First check for WordPress patterns in the main page body
    let found = await detectFromBody(url.origin);
    let messages = [
        ...(found ? ['Found WordPress files in the response body.'] : [])
    ]

    // Check all paths in urlFuzzing array concurrently
    const results = await Promise.allSettled(
        urlFuzzing.map(async ([path, status, body, _]) => {
            try {
                const response = await fetch(new URL(path, url).href);
                let found = false;

                // Check if response status matches expected status
                if (response.status === status) {
                    const html = await response.text();
                    // If body condition is specified, check for it in response
                    if (body && html.includes(body)) {
                        found = true;
                    } else if (!body) {
                        // If no body condition, consider it found based on status
                        found = true;
                    }
                }

                return found;
            } catch (error) {
                console.error(`Error checking ${path}:`, error.message);
                return false;
            }
        })
    )

    // Process results from path fuzzing
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            found = true;
            // Add corresponding message if path was found
            messages.push(urlFuzzing[index][3]);
        }
    });

    // Return results
    return {
        found: found,
        messages: messages.length > 0 ? messages : ['No vulnerabilities found']
    }
}