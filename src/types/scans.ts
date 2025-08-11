export interface IndividualScanResult {
    found: boolean;
    messages: string[];
    elapsed?: number;
};

export interface ScanResult {
    name: string;
    severity: string;
    success: boolean;
    found: boolean;
    messages: string[];
}