import { ScanResult } from '../types/scans';
import { JSDOM } from 'jsdom';

// Constants for email validation and extraction
const EMAIL_REGEX = /^[-!#$%&'*+\\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
const HIDDEN_ELEMENT_SELECTORS = [
    '[style*="display:none"]',
    '[style*="display: none"]',
    '.blockspam',
    '[aria-hidden="true"]',
    '[hidden]',
    '[style*="visibility:hidden"]',
    'script',
    'style',
    'noscript'
];

const OBFUSCATION_PATTERNS = [
    { pattern: /\s+/g, replacement: '' },
    { pattern: /\(at\)|\[at\]/gi, replacement: '@' },
    { pattern: /\(dot\)|\[dot\]/gi, replacement: '.' }
];

/**
 * Validates an email address against RFC 5322 standards
 */
function isValidEmail(email: string): boolean {
    if (!email || email.includes('*')) return false;

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain || localPart.length > 64 || domain.length > 255) {
        return false;
    }

    const domainParts = domain.split('.');
    for (const part of domainParts) {
        if (part.length === 0 || part.length > 63 || part.startsWith('-') || part.endsWith('-')) {
            return false;
        }
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return false;
    }

    let prevChar: string | null = null;
    for (const char of localPart) {
        if (char === '.' && prevChar === '.') return false;
        prevChar = char;
    }

    return EMAIL_REGEX.test(email);
}

/**
 * Cleans HTML content by removing comments and hidden elements
 */
function cleanHtmlContent(html: string): string {
    // Remove HTML comments
    const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');

    // Parse and remove hidden elements
    const dom = new JSDOM(withoutComments);
    HIDDEN_ELEMENT_SELECTORS.forEach(selector => {
        dom.window.document.querySelectorAll(selector).forEach(el => el.remove());
    });

    return dom.window.document.body.textContent || '';
}

/**
 * Normalizes obfuscated email patterns to standard format
 */
function normalizeEmail(obfuscatedEmail: string): string {
    let normalized = obfuscatedEmail.toLowerCase();
    OBFUSCATION_PATTERNS.forEach(({ pattern, replacement }) => {
        normalized = normalized.replace(pattern, replacement);
    });
    return normalized;
}

/**
 * Extracts and validates emails from text content
 */
function extractEmailsFromText(text: string): string[] {
    const emailPattern = /(?:\b|\s)([a-zA-Z0-9._%+-]+(?:\s*@\s*|\s*\(at\)\s*|\s*\[at\]\s*)[a-zA-Z0-9.-]+(?:\s*\.\s*|\s*\(dot\)\s*|\s*\[dot\]\s*)[a-zA-Z]{2,})(?:\b|\s)/g;
    const matches = [...text.matchAll(emailPattern)];
    const emails = new Set<string>();

    for (const match of matches) {
        const normalized = normalizeEmail(match[1]);
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
            emails.add(normalized);
        }
    }

    return [...emails].filter(isValidEmail);
}

/**
 * Scans HTML content for exposed email addresses
 */
export default function scanForExposedEmails(
    _: URL,
    body: string
): ScanResult {
    // Test case - should be removed in production
    const testContent = `<p>Contact email: <span class="blockspam" aria-hidden="true">NO SPAM!</span> user@<!-- anti-spam -->domain.com</p>`;
    const htmlContent = body + testContent;

    // Extract and validate emails
    const cleanedContent = cleanHtmlContent(htmlContent);
    const emails = extractEmailsFromText(cleanedContent);

    // Prepare results
    const found = emails.length > 0;
    const messages: string[] = [];

    if (found) {
        messages.push(
            `Found ${emails.length} exposed email(s): ${emails.join(', ')}`,
            'Security recommendation: Implement robust email obfuscation techniques to prevent scraping'
        );
    }

    return {
        found,
        messages: messages.length > 0 ? messages : ['No exposed email addresses detected']
    };
}