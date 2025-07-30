/**
 * Developer Experience Enhancement System
 *
 * Provides enhanced debugging, development mode, and developer tools
 * for the JsonPlaceholder Client Library
 */
import { ILogger } from './types';
export interface DevModeConfig {
    enabled: boolean;
    verboseLogging?: boolean;
    requestInspection?: boolean;
    responseInspection?: boolean;
    performanceWarnings?: boolean;
    cacheDebugging?: boolean;
    networkSimulation?: NetworkSimulationConfig;
    autoGenerateExamples?: boolean;
}
export interface NetworkSimulationConfig {
    enabled: boolean;
    latency?: number;
    packetLoss?: number;
    bandwidth?: number;
    timeout?: number;
}
export interface RequestInspection {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    timestamp: number;
    cacheKey?: string;
    expectedResponseTime?: number;
}
export interface ResponseInspection {
    requestId: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    responseTime: number;
    cacheHit: boolean;
    timestamp: number;
    size?: number;
}
export interface PerformanceWarning {
    type: 'slow-request' | 'large-response' | 'cache-miss' | 'memory-usage' | 'concurrent-limit';
    message: string;
    details: Record<string, unknown>;
    timestamp: number;
    severity: 'info' | 'warning' | 'error';
}
export interface CodeExample {
    title: string;
    description: string;
    code: string;
    language: 'typescript' | 'javascript';
    category: 'basic' | 'advanced' | 'caching' | 'error-handling' | 'performance';
    runnable: boolean;
}
export declare class DeveloperTools {
    private config;
    private logger;
    private requestInspections;
    private responseInspections;
    private performanceWarnings;
    private codeExamples;
    constructor(config: DevModeConfig, logger: ILogger);
    private getDefaultConfig;
    private setupDeveloperConsole;
    inspectRequest(request: RequestInspection): void;
    inspectResponse(response: ResponseInspection): void;
    addPerformanceWarning(warning: PerformanceWarning): void;
    simulateNetworkConditions(config: NetworkSimulationConfig): void;
    private initializeCodeExamples;
    generateCodeExample(operation: string): CodeExample | null;
    exportDebugData(): Record<string, unknown>;
    clearDebugData(): void;
    getRequestInspections(): RequestInspection[];
    getResponseInspections(): ResponseInspection[];
    getPerformanceWarnings(): PerformanceWarning[];
    getCodeExamples(): CodeExample[];
    updateConfig(newConfig: Partial<DevModeConfig>): void;
    simulateNetworkDelay(): Promise<void>;
    generateDebugReport(): string;
    printDebugReport(): void;
}
export declare class DeveloperFriendlyError extends Error {
    readonly code: string;
    readonly tips: string[];
    readonly examples: string[];
    readonly relatedDocs: string[];
    constructor(message: string, code: string, tips?: string[], examples?: string[], relatedDocs?: string[]);
    toString(): string;
}
export { DeveloperTools as DevTools };
//# sourceMappingURL=developer-tools.d.ts.map