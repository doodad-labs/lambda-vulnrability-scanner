export interface ScanResult {
    found: boolean;
    messages: string[];
    elapsed?: number;
};

export interface VulnerabilityResult {
    name: string;
    severity: string;
    success: boolean;
    found: boolean;
    messages: string[] | string;
}