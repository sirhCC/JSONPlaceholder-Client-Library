/**
 * Cache compression utilities for reducing memory usage and storage size
 * Implements multiple compression strategies for different data types
 */

/**
 * Compression interface for different strategies
 */
export interface CompressionStrategy {
  compress(data: string): string | Promise<string>;
  decompress(compressed: string): string | Promise<string>;
  getCompressionRatio(original: string, compressed: string): number;
  name: string;
}

/**
 * Simple LZ-string style compression for JSON data
 * Works well for JSON with repeated keys and values
 */
export class JSONCompressionStrategy implements CompressionStrategy {
  name = 'json-compression';

  compress(data: string): string {
    try {
      // Parse and re-stringify to normalize JSON
      const parsed = JSON.parse(data);
      const normalized = JSON.stringify(parsed);
      
      // Simple compression by replacing common JSON patterns
      const compressed = normalized
        .replace(/"(\w+)":/g, '$1:')  // Remove quotes from simple keys
        .replace(/","/g, '","')        // Compact string arrays
        .replace(/null/g, 'N')         // Compress null values
        .replace(/true/g, 'T')         // Compress boolean true
        .replace(/false/g, 'F');       // Compress boolean false
      
      // Add compression marker
      return `JSON_COMPRESSED:${compressed}`;
    } catch {
      // If not JSON, return as-is with marker
      return `RAW:${data}`;
    }
  }

  decompress(compressed: string): string {
    if (compressed.startsWith('JSON_COMPRESSED:')) {
      const data = compressed.substring(16);
      
      // Reverse compression
      const decompressed = data
        .replace(/F/g, 'false')
        .replace(/T/g, 'true')
        .replace(/N/g, 'null')
        .replace(/(\w+):/g, '"$1":');
      
      try {
        // Validate by parsing and re-stringifying
        const parsed = JSON.parse(decompressed);
        return JSON.stringify(parsed);
      } catch {
        return decompressed;
      }
    }
    
    if (compressed.startsWith('RAW:')) {
      return compressed.substring(4);
    }
    
    return compressed;
  }

  getCompressionRatio(original: string, compressed: string): number {
    return compressed.length / original.length;
  }
}

/**
 * Dictionary-based compression for repeated API responses
 * Builds a dictionary of common patterns and replaces them with tokens
 */
export class DictionaryCompressionStrategy implements CompressionStrategy {
  name = 'dictionary-compression';
  private dictionary: Map<string, string> = new Map();
  private tokenCounter = 0;

  compress(data: string): string {
    let compressed = data;
    
    // Build dictionary for common patterns in API responses
    const patterns = [
      /"id":\s*(\d+)/g,
      /"title":\s*"([^"]+)"/g,
      /"body":\s*"([^"]+)"/g,
      /"userId":\s*(\d+)/g,
      /"name":\s*"([^"]+)"/g,
      /"email":\s*"([^"]+)"/g,
      /"phone":\s*"([^"]+)"/g,
      /"website":\s*"([^"]+)"/g,
    ];

    // Replace common patterns with tokens
    patterns.forEach((pattern, index) => {
      const token = `__T${index}__`;
      compressed = compressed.replace(pattern, (match) => {
        this.dictionary.set(token, match);
        return token;
      });
    });

    // Add dictionary to compressed data
    const dictStr = JSON.stringify(Array.from(this.dictionary.entries()));
    return `DICT_COMPRESSED:${dictStr}:${compressed}`;
  }

  decompress(compressed: string): string {
    if (!compressed.startsWith('DICT_COMPRESSED:')) {
      return compressed;
    }

    const data = compressed.substring(16);
    const dictEndIndex = data.indexOf(':');
    
    if (dictEndIndex === -1) {
      return compressed;
    }

    try {
      const dictStr = data.substring(0, dictEndIndex);
      const compressedData = data.substring(dictEndIndex + 1);
      
      const dictEntries = JSON.parse(dictStr) as Array<[string, string]>;
      const dictionary = new Map(dictEntries);
      
      let decompressed = compressedData;
      
      // Replace tokens back with original patterns
      dictionary.forEach((value, token) => {
        decompressed = decompressed.replace(new RegExp(token, 'g'), value);
      });
      
      return decompressed;
    } catch {
      return compressed;
    }
  }

  getCompressionRatio(original: string, compressed: string): number {
    return compressed.length / original.length;
  }
}

/**
 * Adaptive compression that chooses the best strategy
 */
export class AdaptiveCompressionStrategy implements CompressionStrategy {
  name = 'adaptive-compression';
  private strategies: CompressionStrategy[] = [
    new JSONCompressionStrategy(),
    new DictionaryCompressionStrategy(),
  ];

  async compress(data: string): Promise<string> {
    let bestCompression = data;
    let bestRatio = 1;
    let bestStrategy = 'none';

    // Try each strategy and pick the best one
    for (const strategy of this.strategies) {
      try {
        const compressed = await strategy.compress(data);
        const ratio = strategy.getCompressionRatio(data, compressed);
        
        if (ratio < bestRatio) {
          bestCompression = compressed;
          bestRatio = ratio;
          bestStrategy = strategy.name;
        }
      } catch {
        // Strategy failed, continue with next
      }
    }

    return `ADAPTIVE:${bestStrategy}:${bestCompression}`;
  }

  async decompress(compressed: string): Promise<string> {
    if (!compressed.startsWith('ADAPTIVE:')) {
      return compressed;
    }

    const data = compressed.substring(9);
    const strategyEndIndex = data.indexOf(':');
    
    if (strategyEndIndex === -1) {
      return compressed;
    }

    const strategyName = data.substring(0, strategyEndIndex);
    const compressedData = data.substring(strategyEndIndex + 1);
    
    const strategy = this.strategies.find(s => s.name === strategyName);
    
    if (!strategy) {
      return compressedData;
    }

    return await strategy.decompress(compressedData);
  }

  getCompressionRatio(original: string, compressed: string): number {
    if (!compressed.startsWith('ADAPTIVE:')) {
      return 1;
    }

    const actualCompressed = compressed.substring(compressed.lastIndexOf(':') + 1);
    return actualCompressed.length / original.length;
  }
}

/**
 * Compression manager for cache storage
 */
export class CacheCompressionManager {
  private strategy: CompressionStrategy;
  private compressionStats = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    compressionCount: 0,
    decompressionCount: 0,
  };

  constructor(strategy: CompressionStrategy = new AdaptiveCompressionStrategy()) {
    this.strategy = strategy;
  }

  async compressForCache(data: unknown): Promise<string> {
    const serialized = JSON.stringify(data);
    const compressed = await this.strategy.compress(serialized);
    
    this.compressionStats.totalOriginalSize += serialized.length;
    this.compressionStats.totalCompressedSize += compressed.length;
    this.compressionStats.compressionCount++;
    
    return compressed;
  }

  async decompressFromCache(compressed: string): Promise<unknown> {
    const decompressed = await this.strategy.decompress(compressed);
    this.compressionStats.decompressionCount++;
    
    try {
      return JSON.parse(decompressed);
    } catch {
      return decompressed;
    }
  }

  getCompressionStats() {
    const avgCompressionRatio = this.compressionStats.totalCompressedSize / 
      (this.compressionStats.totalOriginalSize || 1);
    
    return {
      ...this.compressionStats,
      averageCompressionRatio: avgCompressionRatio,
      spaceSavedBytes: this.compressionStats.totalOriginalSize - this.compressionStats.totalCompressedSize,
      spaceSavedPercentage: ((1 - avgCompressionRatio) * 100).toFixed(1) + '%',
    };
  }

  setCompressionStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
  }

  resetStats(): void {
    this.compressionStats = {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      compressionCount: 0,
      decompressionCount: 0,
    };
  }
}

/**
 * Factory for creating compression managers with different strategies
 */
export class CompressionFactory {
  static createJSONCompressor(): CacheCompressionManager {
    return new CacheCompressionManager(new JSONCompressionStrategy());
  }

  static createDictionaryCompressor(): CacheCompressionManager {
    return new CacheCompressionManager(new DictionaryCompressionStrategy());
  }

  static createAdaptiveCompressor(): CacheCompressionManager {
    return new CacheCompressionManager(new AdaptiveCompressionStrategy());
  }

  static async createBestForDataType(sampleData: string): Promise<CacheCompressionManager> {
    const strategies = [
      new JSONCompressionStrategy(),
      new DictionaryCompressionStrategy(),
      new AdaptiveCompressionStrategy(),
    ];

    let bestStrategy = strategies[0];
    let bestRatio = 1;

    for (const strategy of strategies) {
      try {
        const compressed = await strategy.compress(sampleData);
        const ratio = strategy.getCompressionRatio(sampleData, compressed);
        
        if (ratio < bestRatio) {
          bestStrategy = strategy;
          bestRatio = ratio;
        }
      } catch {
        // Strategy failed
      }
    }

    return new CacheCompressionManager(bestStrategy);
  }
}
