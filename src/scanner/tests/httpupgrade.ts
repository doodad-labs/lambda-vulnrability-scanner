export default async function (url: URL) {
    let found: boolean = false;
    let messages: string[] = []

    // test if requests to http:// are redirected to https://
    const httpUrl = new URL(url.origin);
    httpUrl.protocol = 'http:';

    const httpResponse = await fetch(httpUrl.origin, { method: 'HEAD' }).catch(()=>null);
    if (httpResponse && httpResponse.url.startsWith('http://')) {
        found = true;
        messages.push(`HTTP doesn't redirect to HTTPS`);
    }

    // Return results
    return {
        found: found,
        messages: messages.length > 0 ? messages : ['No vulnerabilities found']
    }
}