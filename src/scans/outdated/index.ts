import { IndividualScanResult } from "../../types/scans";

import jquery from "./jquery";
import lodash from "./lodash";
import bootstrap from "./bootstrap";

type OutdatedScanner = (body: string) => Promise<IndividualScanResult>;

/**
 * Scans HTML content for outdated JavaScript libraries
 * @param url The target URL (unused in current implementation but preserved for future use)
 * @param body HTML content to scan
 * @returns Detection results with findings and messages
 */
export default async function detectOutdatedLibraries(
    url: URL,
    body: string
): Promise<IndividualScanResult> {
    const outdatedScanners: OutdatedScanner[] = [jquery, lodash, bootstrap];
    const scanResults = await runOutdatedScanners(outdatedScanners, body);

    return compileOutdatedResults(scanResults);
}

/**
 * Executes all outdated library detection scanners
 */
async function runOutdatedScanners(
    scanners: OutdatedScanner[],
    body: string
): Promise<PromiseSettledResult<IndividualScanResult>[]> {
    return Promise.allSettled(
        scanners.map(scanner => scanner(body))
    );
}

/**
 * Compiles results from all outdated library scanners
 */
function compileOutdatedResults(
    results: PromiseSettledResult<IndividualScanResult>[]
): IndividualScanResult {
    let found = false;
    const messages: string[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.found) {
            found = true
            messages.push(...result.value.messages);
        }
    });

    return {
        found: found,
        messages: messages.length > 0
            ? messages
            : ['No outdated software detected']
    };
}