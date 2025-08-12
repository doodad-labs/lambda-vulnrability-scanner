export interface IndividualScanResult {
    found: boolean;
    messages: string[];
    elapsed?: number;
    critical?: boolean;
};

export interface ScanResult {
    name: string;
    severity: string;
    success: boolean;
    found: boolean;
    messages: string[];
}