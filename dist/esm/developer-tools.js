/**
 * Developer Experience Enhancement System
 *
 * Provides enhanced debugging, development mode, and developer tools
 * for the JsonPlaceholder Client Library
 */
export class DeveloperTools {
    constructor(config, logger) {
        this.requestInspections = new Map();
        this.responseInspections = new Map();
        this.performanceWarnings = [];
        this.codeExamples = [];
        this.config = { ...this.getDefaultConfig(), ...config };
        this.logger = logger;
        this.initializeCodeExamples();
        if (this.config.enabled) {
            this.logger.info('🚀 Developer Mode enabled with enhanced debugging');
            this.setupDeveloperConsole();
        }
    }
    getDefaultConfig() {
        return {
            enabled: false,
            verboseLogging: true,
            requestInspection: true,
            responseInspection: true,
            performanceWarnings: true,
            cacheDebugging: true,
            networkSimulation: {
                enabled: false,
                latency: 0,
                packetLoss: 0
            },
            autoGenerateExamples: true
        };
    }
    setupDeveloperConsole() {
        if (typeof window !== 'undefined') {
            // Browser environment - add developer tools to window
            window.JsonPlaceholderDevTools = {
                inspectRequests: () => this.getRequestInspections(),
                inspectResponses: () => this.getResponseInspections(),
                getPerformanceWarnings: () => this.getPerformanceWarnings(),
                getCodeExamples: () => this.getCodeExamples(),
                exportDebugData: () => this.exportDebugData(),
                clearDebugData: () => this.clearDebugData(),
                simulateNetworkConditions: (config) => this.simulateNetworkConditions(config),
                generateExample: (operation) => this.generateCodeExample(operation)
            };
            this.logger.info('🛠️ JsonPlaceholder Developer Tools available at window.JsonPlaceholderDevTools');
        }
    }
    // Request/Response Inspection
    inspectRequest(request) {
        if (!this.config.enabled || !this.config.requestInspection)
            return;
        this.requestInspections.set(request.id, request);
        if (this.config.verboseLogging) {
            this.logger.debug(`🔍 Request Inspection [${request.id}]`, {
                method: request.method,
                url: request.url,
                cacheKey: request.cacheKey,
                headers: Object.keys(request.headers).length
            });
        }
        // Performance predictions
        if (request.expectedResponseTime && request.expectedResponseTime > 1000) {
            this.addPerformanceWarning({
                type: 'slow-request',
                message: `Request expected to take ${request.expectedResponseTime}ms`,
                details: { requestId: request.id, url: request.url },
                timestamp: Date.now(),
                severity: 'warning'
            });
        }
    }
    inspectResponse(response) {
        if (!this.config.enabled || !this.config.responseInspection)
            return;
        this.responseInspections.set(response.requestId, response);
        if (this.config.verboseLogging) {
            this.logger.debug(`📥 Response Inspection [${response.requestId}]`, {
                status: response.status,
                responseTime: `${response.responseTime}ms`,
                cacheHit: response.cacheHit,
                size: response.size ? `${Math.round(response.size / 1024)}KB` : 'unknown'
            });
        }
        // Performance analysis
        if (response.responseTime > 2000) {
            this.addPerformanceWarning({
                type: 'slow-request',
                message: `Slow response: ${response.responseTime}ms`,
                details: { requestId: response.requestId, responseTime: response.responseTime },
                timestamp: Date.now(),
                severity: 'warning'
            });
        }
        if (response.size && response.size > 1024 * 1024) { // 1MB
            this.addPerformanceWarning({
                type: 'large-response',
                message: `Large response: ${Math.round(response.size / 1024 / 1024)}MB`,
                details: { requestId: response.requestId, size: response.size },
                timestamp: Date.now(),
                severity: 'warning'
            });
        }
        if (!response.cacheHit && this.config.cacheDebugging) {
            this.logger.debug(`💾 Cache miss for request ${response.requestId}`);
        }
    }
    // Performance Warnings
    addPerformanceWarning(warning) {
        if (!this.config.enabled || !this.config.performanceWarnings)
            return;
        this.performanceWarnings.push(warning);
        // Keep only last 100 warnings
        if (this.performanceWarnings.length > 100) {
            this.performanceWarnings = this.performanceWarnings.slice(-100);
        }
        const logMethod = warning.severity === 'error' ? 'error' :
            warning.severity === 'warning' ? 'warn' : 'info';
        this.logger[logMethod](`⚠️ Performance Warning: ${warning.message}`, warning.details);
    }
    // Network Simulation
    simulateNetworkConditions(config) {
        this.config.networkSimulation = { ...this.config.networkSimulation, ...config };
        if (config.enabled) {
            this.logger.info('🌐 Network simulation enabled', {
                latency: `${config.latency}ms`,
                packetLoss: `${(config.packetLoss || 0) * 100}%`,
                bandwidth: config.bandwidth ? `${Math.round((config.bandwidth || 0) / 1024)}KB/s` : 'unlimited'
            });
        }
        else {
            this.logger.info('🌐 Network simulation disabled');
        }
    }
    // Code Examples Generation
    initializeCodeExamples() {
        this.codeExamples = [
            {
                title: 'Basic Usage',
                description: 'Get started with the JsonPlaceholder client',
                code: `import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

// Fetch all posts
const posts = await client.getPosts();
console.log(\`Found \${posts.length} posts\`);

// Get a specific post
const post = await client.getPost(1);
console.log(post.title);`,
                language: 'typescript',
                category: 'basic',
                runnable: true
            },
            {
                title: 'Caching Configuration',
                description: 'Configure caching for better performance',
                code: `const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  cacheConfig: {
    enabled: true,
    defaultTTL: 300000, // 5 minutes
    maxSize: 100,
    storage: 'memory'
  }
});

// This will be cached
const posts1 = await client.getPosts();

// This will use cache (if within TTL)
const posts2 = await client.getPosts();

// Check cache stats
const stats = client.getCacheStats();
console.log(\`Cache hit rate: \${stats.hitRate}%\`);`,
                language: 'typescript',
                category: 'caching',
                runnable: true
            },
            {
                title: 'Error Recovery',
                description: 'Handle errors gracefully with circuit breakers and retries',
                code: `const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  errorRecoveryConfig: {
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      timeout: 10000
    },
    retry: {
      enabled: true,
      maxAttempts: 3,
      backoffStrategy: 'exponential'
    },
    fallback: {
      enabled: true,
      cacheAsFallback: true
    }
  }
});

try {
  const posts = await client.getPosts();
  console.log('Success:', posts.length);
} catch (error) {
  console.error('All recovery attempts failed:', error.message);
}

// Check error recovery status
client.printErrorRecoveryReport();`,
                language: 'typescript',
                category: 'error-handling',
                runnable: true
            },
            {
                title: 'Performance Monitoring',
                description: 'Monitor and optimize performance',
                code: `const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  performanceConfig: {
    enabled: true,
    trackMemoryUsage: true,
    trackCachePerformance: true
  }
});

// Make some requests
await client.getPosts();
await client.getUsers();
await client.getComments();

// Get performance insights
const dashboard = client.getPerformanceDashboard();
console.log(dashboard.getReport());

// Real-time metrics
const metrics = dashboard.getRealTimeMetrics();
console.log(\`Average response time: \${metrics.averageResponseTime}ms\`);`,
                language: 'typescript',
                category: 'performance',
                runnable: true
            },
            {
                title: 'Advanced Search & Filtering',
                description: 'Search and filter data efficiently',
                code: `// Search posts by title
const searchResults = await client.searchPosts({
  title: 'lorem',
  limit: 10
});

// Search with multiple criteria
const filteredPosts = await client.getPosts({
  userId: 1,
  limit: 5
});

// Search users by name or email
const users = await client.searchUsers({
  name: 'Leanne',
  email: '@gmail.com'
});

// Get comments for a specific post
const comments = await client.getComments({ postId: 1 });`,
                language: 'typescript',
                category: 'advanced',
                runnable: true
            }
        ];
    }
    generateCodeExample(operation) {
        const templates = {
            'getPosts': {
                title: 'Fetch Posts',
                code: `const posts = await client.getPosts();
console.log(\`Found \${posts.length} posts\`);`,
                category: 'basic'
            },
            'getPost': {
                title: 'Get Single Post',
                code: `const post = await client.getPost(1);
console.log(post.title);`,
                category: 'basic'
            },
            'searchPosts': {
                title: 'Search Posts',
                code: `const results = await client.searchPosts({
  title: 'search term',
  limit: 10
});`,
                category: 'advanced'
            },
            'caching': {
                title: 'Enable Caching',
                code: `const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  cacheConfig: { enabled: true, defaultTTL: 300000 }
});`,
                category: 'caching'
            }
        };
        const template = templates[operation];
        if (!template)
            return null;
        return {
            title: template.title || `Generated: ${operation}`,
            description: `Auto-generated example for ${operation}`,
            code: template.code || `// Example for ${operation}`,
            language: 'typescript',
            category: template.category || 'basic',
            runnable: true
        };
    }
    // Debug Data Management
    exportDebugData() {
        return {
            config: this.config,
            requests: Array.from(this.requestInspections.values()),
            responses: Array.from(this.responseInspections.values()),
            warnings: this.performanceWarnings,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }
    clearDebugData() {
        this.requestInspections.clear();
        this.responseInspections.clear();
        this.performanceWarnings = [];
        this.logger.info('🧹 Debug data cleared');
    }
    // Getters for inspection data
    getRequestInspections() {
        return Array.from(this.requestInspections.values());
    }
    getResponseInspections() {
        return Array.from(this.responseInspections.values());
    }
    getPerformanceWarnings() {
        return [...this.performanceWarnings];
    }
    getCodeExamples() {
        return [...this.codeExamples];
    }
    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.config.enabled && !this.config.enabled) {
            this.logger.info('🚀 Developer Mode enabled');
            this.setupDeveloperConsole();
        }
        else if (!this.config.enabled) {
            this.logger.info('🔒 Developer Mode disabled');
        }
    }
    // Helper for network delay simulation
    async simulateNetworkDelay() {
        if (!this.config.networkSimulation?.enabled || !this.config.networkSimulation.latency) {
            return;
        }
        const delay = this.config.networkSimulation.latency;
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // Generate debug report
    generateDebugReport() {
        const requests = this.getRequestInspections();
        const responses = this.getResponseInspections();
        const warnings = this.getPerformanceWarnings();
        const totalRequests = requests.length;
        const totalResponses = responses.length;
        const averageResponseTime = responses.length > 0
            ? responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length
            : 0;
        const cacheHitRate = responses.length > 0
            ? responses.filter(r => r.cacheHit).length / responses.length * 100
            : 0;
        return `
🛠️ DEVELOPER DEBUG REPORT
════════════════════════════════════
📊 STATISTICS
   Total Requests: ${totalRequests}
   Total Responses: ${totalResponses}
   Average Response Time: ${Math.round(averageResponseTime)}ms
   Cache Hit Rate: ${Math.round(cacheHitRate)}%
   Performance Warnings: ${warnings.length}

⚠️ RECENT WARNINGS
${warnings.slice(-5).map(w => `   ${w.severity.toUpperCase()}: ${w.message}`).join('\n') || '   No recent warnings'}

🔧 DEVELOPER MODE CONFIG
   Enabled: ${this.config.enabled ? 'Yes' : 'No'}
   Request Inspection: ${this.config.requestInspection ? 'Yes' : 'No'}
   Response Inspection: ${this.config.responseInspection ? 'Yes' : 'No'}
   Performance Warnings: ${this.config.performanceWarnings ? 'Yes' : 'No'}
   Network Simulation: ${this.config.networkSimulation?.enabled ? 'Yes' : 'No'}

💡 TIPS
   • Use window.JsonPlaceholderDevTools in browser console
   • Check cache performance with getCacheStats()
   • Monitor error recovery with printErrorRecoveryReport()
   • Export debug data with exportDebugData()
    `;
    }
    // Print debug report to console
    printDebugReport() {
        this.logger.info(this.generateDebugReport());
    }
}
// Enhanced error messages with developer tips
export class DeveloperFriendlyError extends Error {
    constructor(message, code, tips = [], examples = [], relatedDocs = []) {
        super(message);
        this.name = 'DeveloperFriendlyError';
        this.code = code;
        this.tips = tips;
        this.examples = examples;
        this.relatedDocs = relatedDocs;
    }
    toString() {
        let result = `${this.name}: ${this.message}`;
        if (this.tips.length > 0) {
            result += '\n\n💡 Developer Tips:\n' + this.tips.map(tip => `   • ${tip}`).join('\n');
        }
        if (this.examples.length > 0) {
            result += '\n\n📝 Code Examples:\n' + this.examples.map(example => `   ${example}`).join('\n');
        }
        if (this.relatedDocs.length > 0) {
            result += '\n\n📚 Related Documentation:\n' + this.relatedDocs.map(doc => `   • ${doc}`).join('\n');
        }
        return result;
    }
}
export { DeveloperTools as DevTools };
//# sourceMappingURL=developer-tools.js.map