import { IndividualScanResult } from '../types/scans';
import dns from 'dns/promises';
import net from 'net';
import { Client } from 'ssh2';

// Security constants
const SSH_PORT = 22;
const CONNECTION_TIMEOUT_MS = 3000;
const OUTDATED_SSH_VERSIONS = ['SSH-1.'];
const WEAK_AUTH_METHODS = ['password', 'none'];

const COMMON_USERNAMES = [
    'root',
    'admin',
    'pi'
];

const COMMON_PASSWORDS = [
    'password',
    'toor',
    'admin',
    'root',
    'raspberry'
]

type SSHAuthCheckResult = {
    isOpen: boolean;
    authMethods?: string[];
    banner?: string;
    acceptsPasswordAuth?: boolean;
    testedCredentials?: { username: string; password: string; accepted: boolean }[];
};

type SSHScanFindings = {
    isOpen: boolean;
    isCritical: boolean;
    messages: string[];
    version?: string;
};

/**
 * Scans a target URL for SSH server vulnerabilities
 */
export default async function scanSSHServer(
    url: URL
): Promise<IndividualScanResult> {
    const findings: SSHScanFindings = {
        isOpen: false,
        isCritical: false,
        messages: []
    };

    try {
        const targetIp = await resolveTargetIP(url.hostname);
        if (!targetIp) {
            return toScanResult(findings);
        }

        const sshInfo = await checkSSHServer(targetIp);
        analyzeSSHFindings(sshInfo, findings, targetIp);

        if (findings.isOpen) {
            // test common credentials, even if password auth is not enabled (could be a misconfiguration)
            const credentialResults = await testCommonCredentials(targetIp);
            analyzeCredentialResults(credentialResults, findings);
        }

    } catch (error) {
        findings.messages.push(
            `Scan error: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    return toScanResult(findings);
}

/**
 * Tests common default credentials against the SSH server
 */
async function testCommonCredentials(ip: string): Promise<{ username: string; password: string; accepted: boolean }[]> {
    const results = Promise.allSettled(
        COMMON_USERNAMES.flatMap(username =>
            COMMON_PASSWORDS.map(password => 
                testSSHCredentials(ip, username, password).then(accepted => ({
                    username,
                    password,
                    accepted
                }))
            )
        )
    )
    .then(res => res.filter(r => r.status === 'fulfilled').map(r => r.value));

    return results;
}

/**
 * Attempts to authenticate with given credentials
 */
async function testSSHCredentials(ip: string, username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
        const conn = new Client();

        conn.on('ready', () => {
            conn.end();
            resolve(true);
        }).on('error', () => {
            resolve(false);
        }).connect({
            host: ip,
            port: 22,
            username,
            password,
            readyTimeout: 3000,
            tryKeyboard: false
        });
    });
}

/**
 * Analyzes credential test results
 */
function analyzeCredentialResults(
    results: { username: string; password: string; accepted: boolean }[],
    findings: SSHScanFindings
) {
    const successfulLogins = results.filter(r => r.accepted);

    if (successfulLogins.length > 0) {
        findings.isCritical = true;
        successfulLogins.forEach(() => {

            // Don't log credentials
            findings.messages.push(
                `CRITICAL: Accepted common credentials!`
            );
        });
        findings.messages.push(
            'IMMEDIATE ACTION REQUIRED: Change all default credentials!'
        );
    }
}

/**
 * Resolves domain to primary IP address
 */
async function resolveTargetIP(hostname: string): Promise<string | null> {
    const ipAddresses = await dns.resolve(hostname);
    return ipAddresses[0] || null;
}

/**
 * Checks SSH server configuration and authentication methods
 */
async function checkSSHServer(
    ip: string,
    port: number = SSH_PORT
): Promise<SSHAuthCheckResult> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let responseData = Buffer.alloc(0);
        let banner = '';

        socket.setTimeout(CONNECTION_TIMEOUT_MS);
        socket.connect(port, ip);

        socket.on('connect', () => {
            // Connection established, wait for server banner
        });

        socket.on('data', (data) => {
            responseData = Buffer.concat([responseData, data]);

            // Extract SSH banner (first line)
            if (!banner && responseData.includes('\n')) {
                banner = extractSSHBanner(responseData);
            }

            // Analyze server response for auth methods
            const authMethods = detectAuthMethods(responseData.toString());
            if (authMethods) {
                resolve({ isOpen: true, authMethods, banner });
                socket.destroy();
            }
        });

        socket.on('timeout', () => handleSocketClose(socket, banner, resolve));
        socket.on('error', () => handleSocketClose(socket, banner, resolve));
        socket.on('close', () => handleSocketClose(socket, banner, resolve));
    });
}

/**
 * Extracts SSH server banner from response data
 */
function extractSSHBanner(data: Buffer): string {
    const bannerEnd = data.indexOf('\n');
    return data.subarray(0, bannerEnd).toString().trim();
}

/**
 * Detects supported authentication methods from server response
 */
function detectAuthMethods(response: string): string[] | null {
    if (!response.includes('SSH-2.0')) {
        return null;
    }

    const methods = [];
    if (response.includes('password')) methods.push('password');
    if (response.includes('publickey')) methods.push('publickey');
    if (response.includes('gssapi-with-mic')) methods.push('gssapi-with-mic');
    if (response.includes('hostbased')) methods.push('hostbased');
    if (response.includes('none')) methods.push('none');

    return methods.length > 0 ? methods : null;
}

/**
 * Handles socket cleanup and final response
 */
function handleSocketClose(
    socket: net.Socket,
    banner: string,
    resolve: (result: SSHAuthCheckResult) => void
) {
    socket.destroy();
    resolve({
        isOpen: !!banner,
        ...(banner ? { banner } : {})
    });
}

/**
 * Analyzes SSH findings and generates security messages
 */
function analyzeSSHFindings(
    result: SSHAuthCheckResult,
    findings: SSHScanFindings,
    targetIp: string
) {
    findings.isOpen = result.isOpen;

    if (!result.isOpen) {
        return;
    }

    findings.messages.push(`SSH port (${SSH_PORT}) is open on ${targetIp}`);

    if (result.banner) {
        const version = analyzeSSHVersion(result.banner);
        findings.messages.push(...version.messages);
        findings.version = version.version;
    }

    if (result.authMethods) {
        analyzeAuthMethods(result.authMethods, findings);
    }
}

/**
 * Checks SSH version for vulnerabilities
 */
function analyzeSSHVersion(banner: string): { version?: string; messages: string[] } {
    const version = banner.split(' ')[0];
    const messages: string[] = [`SSH version: ${version}`];

    if (OUTDATED_SSH_VERSIONS.some(v => version.startsWith(v))) {
        messages.push(`Warning: Outdated SSH version (${version}) - security vulnerabilities likely`);
    }

    return { version, messages };
}

/**
 * Evaluates authentication methods for security risks
 */
function analyzeAuthMethods(methods: string[], findings: SSHScanFindings) {
    findings.messages.push(`Auth methods: ${methods.join(', ')}`);

    if (methods.includes('none')) {
        findings.isCritical = true;
        findings.messages.push('CRITICAL: Server allows unauthenticated access!');
    }

    if (methods.includes('password')) {
        findings.messages.push('Warning: Password auth enabled - prefer key-based auth');
    }

    if (methods.some(m => WEAK_AUTH_METHODS.includes(m))) {
        findings.messages.push('Security recommendation: Disable weak authentication methods');
    }
}

/**
 * Converts findings to the standard scan result format
 */
function toScanResult(findings: SSHScanFindings): IndividualScanResult {
    return {
        found: findings.isOpen,
        critical: findings.isCritical,
        messages: findings.messages.length > 0
            ? findings.messages
            : ['No SSH vulnerabilities found']
    };
}