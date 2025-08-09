import { ScanResult } from "../../types/scans";

import jquery from "./jquery";
import lodash from "./lodash";

type OutdatedScanner = (body: string) => Promise<ScanResult>;

/**
 * Scans HTML content for outdated JavaScript libraries
 * @param url The target URL (unused in current implementation but preserved for future use)
 * @param body HTML content to scan
 * @returns Detection results with findings and messages
 */
export default async function detectOutdatedLibraries(
    url: URL,
    body: string
): Promise<ScanResult> {
    const outdatedScanners: OutdatedScanner[] = [jquery, lodash];
    const scanResults = await runOutdatedScanners(outdatedScanners, body);

    return compileOutdatedResults(scanResults);
}

/**
 * Executes all outdated library detection scanners
 */
async function runOutdatedScanners(
    scanners: OutdatedScanner[],
    body: string
): Promise<PromiseSettledResult<ScanResult>[]> {
    return Promise.allSettled(
        scanners.map(scanner => scanner(body))
    );
}

/**
 * Compiles results from all outdated library scanners
 */
function compileOutdatedResults(
    results: PromiseSettledResult<ScanResult>[]
): ScanResult {
    let anyFound = false;
    const allMessages: string[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            anyFound = anyFound || result.value.found;
            allMessages.push(...result.value.messages);
        }
    });

    return {
        found: anyFound,
        messages: allMessages.length > 0
            ? allMessages
            : ['No outdated software detected']
    };
}