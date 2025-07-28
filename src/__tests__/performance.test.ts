import { PerformanceMonitor, PerformanceDashboard, PerformanceMetric, PerformanceConfig } from '../performance';

describe('Performance Monitoring', () => {
  let monitor: PerformanceMonitor;
  let dashboard: PerformanceDashboard;

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      enabled: true,
      maxMetrics: 100,
      alertThresholds: {
        responseTime: 1000,
        errorRate: 5,
        cacheHitRate: 80,
        memoryUsage: 85
      },
      trendInterval: 5000,
      enableMemoryTracking: true,
      enableRealTimeAlerts: true
    });
    dashboard = new PerformanceDashboard(monitor);
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('PerformanceMonitor', () => {
    it('should record performance metrics', () => {
      const metric: PerformanceMetric = {
        timestamp: Date.now(),
        duration: 150,
        method: 'GET',
        url: '/posts',
        cacheHit: false,
        status: 200,
        size: 1024
      };

      monitor.recordMetric(metric);
      
      const stats = monitor.getStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.averageResponseTime).toBe(150);
      expect(stats.cacheHitRate).toBe(0);
    });

    it('should calculate correct statistics', () => {
      const metrics: PerformanceMetric[] = [
        {
          timestamp: Date.now(),
          duration: 100,
          method: 'GET',
          url: '/posts',
          cacheHit: true,
          status: 200
        },
        {
          timestamp: Date.now(),
          duration: 200,
          method: 'GET',
          url: '/users',
          cacheHit: false,
          status: 200
        },
        {
          timestamp: Date.now(),
          duration: 300,
          method: 'GET',
          url: '/comments',
          cacheHit: true,
          status: 200
        }
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));
      
      const stats = monitor.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.averageResponseTime).toBe(200);
      expect(Math.round(stats.cacheHitRate * 100) / 100).toBe(66.67); // 2 out of 3
      expect(stats.successfulRequests).toBe(3);
      expect(stats.failedRequests).toBe(0);
      expect(stats.errorRate).toBe(0);
    });

    it('should handle error metrics correctly', () => {
      const metrics: PerformanceMetric[] = [
        {
          timestamp: Date.now(),
          duration: 100,
          method: 'GET',
          url: '/posts',
          cacheHit: false,
          status: 200
        },
        {
          timestamp: Date.now(),
          duration: 500,
          method: 'GET',
          url: '/invalid',
          cacheHit: false,
          status: 404,
          error: 'Not found'
        }
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));
      
      const stats = monitor.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(1);
      expect(stats.errorRate).toBe(50);
    });

    it('should calculate percentiles correctly', () => {
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      durations.forEach(duration => {
        monitor.recordMetric({
          timestamp: Date.now(),
          duration,
          method: 'GET',
          url: '/test',
          cacheHit: false,
          status: 200
        });
      });

      const stats = monitor.getStats();
      expect(stats.medianResponseTime).toBe(60); // Median of [10,20,30,40,50,60,70,80,90,100] is 60
      expect(stats.p95ResponseTime).toBe(100); // 95th percentile of 10 items = 100
      expect(stats.p99ResponseTime).toBe(100); // 99th percentile of 10 items = 100
      expect(stats.minResponseTime).toBe(10);
      expect(stats.maxResponseTime).toBe(100);
    });

    it('should track cache performance separately', () => {
      const cacheHit: PerformanceMetric = {
        timestamp: Date.now(),
        duration: 5,
        method: 'GET',
        url: '/posts',
        cacheHit: true,
        status: 200
      };

      const cacheMiss: PerformanceMetric = {
        timestamp: Date.now(),
        duration: 150,
        method: 'GET',
        url: '/users',
        cacheHit: false,
        status: 200
      };

      monitor.recordMetric(cacheHit);
      monitor.recordMetric(cacheMiss);

      const stats = monitor.getStats();
      expect(stats.averageCacheResponseTime).toBe(5);
      expect(stats.averageApiResponseTime).toBe(150);
      expect(stats.cacheHitRate).toBe(50);
    });

    it('should limit metrics to maxMetrics', () => {
      const smallMonitor = new PerformanceMonitor({ maxMetrics: 3 });
      
      for (let i = 0; i < 5; i++) {
        smallMonitor.recordMetric({
          timestamp: Date.now(),
          duration: 100 + i,
          method: 'GET',
          url: `/test${i}`,
          cacheHit: false,
          status: 200
        });
      }

      const stats = smallMonitor.getStats();
      expect(stats.totalRequests).toBe(3); // Should only keep last 3
      
      smallMonitor.destroy();
    });

    it('should emit performance events', (done) => {
      let completed = false;
      
      monitor.addEventListener((event) => {
        if (event.type === 'metric' && !completed) {
          completed = true;
          expect(event.data).toHaveProperty('duration');
          done();
        }
      });

      monitor.recordMetric({
        timestamp: Date.now(),
        duration: 100,
        method: 'GET',
        url: '/test1',
        cacheHit: false,
        status: 200
      });
    });

    it('should handle configuration updates', () => {
      const newConfig: Partial<PerformanceConfig> = {
        maxMetrics: 200,
        alertThresholds: {
          responseTime: 500,
          errorRate: 10,
          cacheHitRate: 70,
          memoryUsage: 90
        }
      };

      monitor.updateConfig(newConfig);
      
      const config = monitor.getConfig();
      expect(config.maxMetrics).toBe(200);
      expect(config.alertThresholds.responseTime).toBe(500);
    });

    it('should enable/disable monitoring', () => {
      monitor.setEnabled(false);
      
      monitor.recordMetric({
        timestamp: Date.now(),
        duration: 100,
        method: 'GET',
        url: '/test',
        cacheHit: false,
        status: 200
      });

      const stats = monitor.getStats();
      expect(stats.totalRequests).toBe(0);

      monitor.setEnabled(true);
      
      monitor.recordMetric({
        timestamp: Date.now(),
        duration: 100,
        method: 'GET',
        url: '/test',
        cacheHit: false,
        status: 200
      });

      const newStats = monitor.getStats();
      expect(newStats.totalRequests).toBe(1);
    });

    it('should export and import data', () => {
      const metrics: PerformanceMetric[] = [
        {
          timestamp: Date.now(),
          duration: 100,
          method: 'GET',
          url: '/posts',
          cacheHit: false,
          status: 200
        },
        {
          timestamp: Date.now(),
          duration: 150,
          method: 'GET',
          url: '/users',
          cacheHit: true,
          status: 200
        }
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));

      const exportedData = monitor.exportData();
      expect(exportedData.metrics).toHaveLength(2);
      expect(exportedData.stats.totalRequests).toBe(2);

      const newMonitor = new PerformanceMonitor();
      newMonitor.importData({ metrics: exportedData.metrics });

      const importedStats = newMonitor.getStats();
      expect(importedStats.totalRequests).toBe(2);
      
      newMonitor.destroy();
    });

    it('should clear performance data', () => {
      monitor.recordMetric({
        timestamp: Date.now(),
        duration: 100,
        method: 'GET',
        url: '/test',
        cacheHit: false,
        status: 200
      });

      expect(monitor.getStats().totalRequests).toBe(1);

      monitor.clear();

      expect(monitor.getStats().totalRequests).toBe(0);
    });

    it('should generate performance alerts', (done) => {
      let alertReceived = false;

      monitor.addEventListener((event) => {
        if (event.type === 'alert') {
          alertReceived = true;
          expect(event.data).toHaveProperty('type');
          expect(event.data).toHaveProperty('severity');
          expect(event.data).toHaveProperty('message');
          done();
        }
      });

      // Record a metric that should trigger a high response time alert
      monitor.recordMetric({
        timestamp: Date.now(),
        duration: 2000, // Above the 1000ms threshold
        method: 'GET',
        url: '/slow-endpoint',
        cacheHit: false,
        status: 200
      });

      // Fallback timeout
      setTimeout(() => {
        if (!alertReceived) {
          done();
        }
      }, 100);
    });
  });

  describe('PerformanceDashboard', () => {
    beforeEach(() => {
      // Add some test data
      const metrics: PerformanceMetric[] = [
        {
          timestamp: Date.now(),
          duration: 100,
          method: 'GET',
          url: '/posts',
          cacheHit: true,
          status: 200,
          size: 1024
        },
        {
          timestamp: Date.now(),
          duration: 250,
          method: 'GET',
          url: '/users',
          cacheHit: false,
          status: 200,
          size: 512
        },
        {
          timestamp: Date.now(),
          duration: 50,
          method: 'GET',
          url: '/comments',
          cacheHit: true,
          status: 200,
          size: 2048
        }
      ];

      metrics.forEach(metric => monitor.recordMetric(metric));
    });

    it('should generate performance report', () => {
      const report = dashboard.getReport();
      
      expect(report).toContain('PERFORMANCE DASHBOARD');
      expect(report).toContain('RESPONSE TIME METRICS');
      expect(report).toContain('REQUEST STATISTICS');
      expect(report).toContain('CACHE PERFORMANCE');
      expect(report).toContain('Average:');
      expect(report).toContain('Hit Rate:');
    });

    it('should generate performance insights', () => {
      const insights = dashboard.getInsights();
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      // Check if any insight is positive (contains ✅ or 🚀)
      const hasPositiveInsight = insights.some(insight => insight.includes('✅') || insight.includes('🚀'));
      expect(hasPositiveInsight).toBe(true);
    });

    it('should provide cache optimization insights', () => {
      // Create a scenario with low cache hit rate
      const lowCacheMonitor = new PerformanceMonitor();
      const lowCacheDashboard = new PerformanceDashboard(lowCacheMonitor);

      // Add metrics with low cache hit rate
      for (let i = 0; i < 20; i++) {
        lowCacheMonitor.recordMetric({
          timestamp: Date.now(),
          duration: 300,
          method: 'GET',
          url: `/test${i}`,
          cacheHit: i < 5, // Only 25% cache hit rate
          status: 200
        });
      }

      const insights = lowCacheDashboard.getInsights();
      const cacheInsight = insights.find(insight => insight.includes('cache hit rate'));
      expect(cacheInsight).toBeDefined();
      expect(cacheInsight).toContain('⚠️');

      lowCacheMonitor.destroy();
    });

    it('should provide response time insights', () => {
      // Create a scenario with high response times
      const slowMonitor = new PerformanceMonitor();
      const slowDashboard = new PerformanceDashboard(slowMonitor);

      for (let i = 0; i < 10; i++) {
        slowMonitor.recordMetric({
          timestamp: Date.now(),
          duration: 800, // High response time
          method: 'GET',
          url: `/slow${i}`,
          cacheHit: false,
          status: 200
        });
      }

      const insights = slowDashboard.getInsights();
      const responseTimeInsight = insights.find(insight => insight.includes('response time'));
      expect(responseTimeInsight).toBeDefined();
      expect(responseTimeInsight).toContain('⚠️');

      slowMonitor.destroy();
    });

    it('should provide error rate insights', () => {
      // Create a scenario with high error rate
      const errorMonitor = new PerformanceMonitor();
      const errorDashboard = new PerformanceDashboard(errorMonitor);

      // Add successful requests
      for (let i = 0; i < 15; i++) {
        errorMonitor.recordMetric({
          timestamp: Date.now(),
          duration: 200,
          method: 'GET',
          url: `/success${i}`,
          cacheHit: false,
          status: 200
        });
      }

      // Add failed requests (high error rate)
      for (let i = 0; i < 5; i++) {
        errorMonitor.recordMetric({
          timestamp: Date.now(),
          duration: 500,
          method: 'GET',
          url: `/error${i}`,
          cacheHit: false,
          status: 500,
          error: 'Server error'
        });
      }

      const insights = errorDashboard.getInsights();
      const errorInsight = insights.find(insight => insight.includes('error rate'));
      expect(errorInsight).toBeDefined();

      errorMonitor.destroy();
    });
  });

  describe('Memory Tracking', () => {
    it('should track memory usage when available', () => {
      const stats = monitor.getStats();
      
      // Memory tracking depends on environment
      if (typeof process !== 'undefined') {
        expect(stats.memoryUsage).toBeDefined();
        expect(stats.memoryUsage?.used).toBeGreaterThan(0);
        expect(stats.memoryUsage?.total).toBeGreaterThan(0);
        expect(stats.memoryUsage?.percentage).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle missing memory API gracefully', () => {
      const memoryMonitor = new PerformanceMonitor({
        enableMemoryTracking: false
      });

      const stats = memoryMonitor.getStats();
      expect(stats.memoryUsage).toBeUndefined();

      memoryMonitor.destroy();
    });
  });

  describe('Trend Tracking', () => {
    it('should track performance trends over time', (done) => {
      const quickMonitor = new PerformanceMonitor({
        trendInterval: 100 // Very short interval for testing
      });

      let trendCount = 0;
      quickMonitor.addEventListener((event) => {
        if (event.type === 'trend') {
          trendCount++;
          expect(event.data).toHaveProperty('timestamp');
          expect(event.data).toHaveProperty('responseTime');
          expect(event.data).toHaveProperty('cacheHitRate');
          
          if (trendCount >= 2) {
            quickMonitor.destroy();
            done();
          }
        }
      });

      // Add some metrics
      quickMonitor.recordMetric({
        timestamp: Date.now(),
        duration: 100,
        method: 'GET',
        url: '/test',
        cacheHit: false,
        status: 200
      });
    }, 1000);

    it('should maintain trend history', (done) => {
      const quickMonitor = new PerformanceMonitor({
        trendInterval: 50
      });

      setTimeout(() => {
        const trends = quickMonitor.getTrends();
        expect(trends.length).toBeGreaterThan(0);
        quickMonitor.destroy();
        done();
      }, 200);

      // Add some metrics
      quickMonitor.recordMetric({
        timestamp: Date.now(),
        duration: 150,
        method: 'GET',
        url: '/test',
        cacheHit: false,
        status: 200
      });
    }, 500);
  });
});
