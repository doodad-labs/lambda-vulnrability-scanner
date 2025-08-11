import { program } from 'commander';
import scanner from '../src/scanner';
import { requests } from '../src/utils/fetch';

program
  .argument('<url>', 'URL to scan');

program.parse();

const rawUrl = program.args[0];

if (!rawUrl) {
  console.error('Error: URL argument is required.');
  process.exit(1);
}

let url: URL;
try {
    url = new URL(rawUrl);
} catch (err) {
    console.error('Error: Invalid URL format.', err);
    process.exit(1);
}

console.log(`Starting scan for URL: ${url.href}`);

function duplicateRequestFinder(requests: string[]): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    requests.forEach((req) => {
        if (seen.has(req)) {
            duplicates.push(req);
        } else {
            seen.add(req);
        }
    });

    return duplicates;
}

scanner(url).then((results) => {
    
    console.log(' ');

    console.log('Requests made during scan:');
    requests.forEach((req, index) => {
        console.log(`${index + 1}: ${req}`);
    });

    console.log(' ');

    const duplicates = duplicateRequestFinder(requests);
    if (duplicates.length > 0) {
        console.log('Duplicate requests found:');
        duplicates.forEach((dup, index) => {
            console.log(`Duplicate ${index + 1}: ${dup}`);
        });
    } else {
        console.log('No duplicate requests found.');
    }

    console.log(' ');

    console.log('Scan results:');
    results.result.filter(result => result.found).forEach((result, index) => {
        console.log(' ')
        console.log(`${index + 1}: ${result.name} - Severity: ${result.severity}`);
        result.messages.forEach((msg, msgIndex) => {
            console.log(`   Message ${msgIndex + 1}: ${msg}`);
        });
        console.log(' ')
    })
    
}).catch((err) => {
    console.error('Error during scan:', err);
    process.exit(1);
})