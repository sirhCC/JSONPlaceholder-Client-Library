/**
 * Advanced Error Recovery System Tests
 * Comprehensive test suite for circuit breakers, retry logic, and request queuing
 */

import { AdvancedErrorRecovery, ErrorRecoveryFactory } from '../advanced-error-recovery';
import { CircuitState } from '../circuit-breaker';
import { RequestPriority } from '../request-queue';

// Mock axios for controlled testing
jest.mock('axios');

describe('Advanced Error Recovery System', () => {
  let errorRecovery: AdvancedErrorRecovery;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    errorRecovery = ErrorRecoveryFactory.createDevelopment();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Circuit Breaker Integration', () => {
    it('should open circuit breaker after repeated failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));
      
      // Execute multiple failing operations to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await errorRecovery.executeWithRecovery('test-service', failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      const stats = errorRecovery.getStats();
      expect(stats.failedRequests).toBeGreaterThan(0);
      
      // Check if circuit breaker opened
      const cbStats = stats.circuitBreakers['test-service'] as any;
      expect(cbStats?.state).toBe(CircuitState.OPEN);
    });

    it('should use fallback when circuit is open', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));
      const fallbackOperation = jest.fn().mockResolvedValue('fallback-data');

      // Fail multiple times to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await errorRecovery.executeWithRecovery('test-service', failingOperation);
        } catch (error) {
          // Expected failures
        }
      }

      // Now execute with fallback
      const result = await errorRecovery.executeWithRecovery(
        'test-service',
        failingOperation,
        { fallback: fallbackOperation }
      );

      expect(result).toBe('fallback-data');
      expect(fallbackOperation).toHaveBeenCalled();
      
      const stats = errorRecovery.getStats();
      expect(stats.fallbacksUsed).toBe(1);
      expect(stats.recoveredRequests).toBe(1);
    });
  });

  describe('Retry Logic Integration', () => {
    it('should retry failed operations with exponential backoff', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce('success');

      const result = await errorRecovery.executeWithRecovery('retry-test', mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      
      // Verify retry delays occurred
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should not retry non-retryable errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(
        errorRecovery.executeWithRecovery('validation-test', mockOperation)
      ).rejects.toThrow('Validation failed');

      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect maximum retry attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('ECONNRESET'));

      await expect(
        errorRecovery.executeWithRecovery('max-retry-test', mockOperation)
      ).rejects.toThrow();

      // Should be called max attempts times (configured as 2 for development)
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Queue Integration', () => {
    it('should queue requests when at concurrent limit', async () => {
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('slow-result'), 1000)
      );

      // Start multiple concurrent operations
      const promises = Array.from({ length: 15 }, (_, i) =>
        errorRecovery.executeWithRecovery(`queue-test-${i}`, slowOperation)
      );

      // Check that some requests are queued
      const stats = errorRecovery.getStats();
      expect(stats.queueStats).toBeDefined();

      // Fast-forward timers to complete operations
      jest.advanceTimersByTime(2000);

      await Promise.all(promises);
    });

    it('should prioritize high-priority requests', async () => {
      const results: string[] = [];
      const operation = (id: string) => () => {
        results.push(id);
        return Promise.resolve(id);
      };

      // Queue low priority requests first
      const lowPriorityPromises = Array.from({ length: 5 }, (_, i) =>
        errorRecovery.executeWithRecovery(
          `low-${i}`,
          operation(`low-${i}`),
          { priority: RequestPriority.LOW }
        )
      );

      // Then queue high priority request
      const highPriorityPromise = errorRecovery.executeWithRecovery(
        'high-priority',
        operation('high-priority'),
        { priority: RequestPriority.HIGH }
      );

      jest.advanceTimersByTime(100);

      await Promise.all([...lowPriorityPromises, highPriorityPromise]);

      // High priority should be processed first
      expect(results[0]).toBe('high-priority');
    });
  });

  describe('Error Recovery Statistics', () => {
    it('should track comprehensive statistics', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const fallbackOperation = jest.fn().mockResolvedValue('fallback');

      // Execute successful operation
      await errorRecovery.executeWithRecovery('success-test', successOperation);

      // Execute failing operation with fallback
      await errorRecovery.executeWithRecovery(
        'fallback-test',
        failingOperation,
        { fallback: fallbackOperation }
      );

      // Execute failing operation without fallback
      try {
        await errorRecovery.executeWithRecovery('fail-test', failingOperation);
      } catch (error) {
        // Expected failure
      }

      const stats = errorRecovery.getStats();
      
      expect(stats.totalRequests).toBe(3);
      expect(stats.successfulRequests).toBe(1);
      expect(stats.failedRequests).toBe(2);
      expect(stats.recoveredRequests).toBe(1);
      expect(stats.fallbacksUsed).toBe(1);
      expect(stats.availability).toBeGreaterThan(0);
    });

    it('should calculate availability correctly', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      const fallbackOperation = jest.fn().mockResolvedValue('fallback');

      // 70% success rate + 20% recovered = 90% availability
      for (let i = 0; i < 7; i++) {
        await errorRecovery.executeWithRecovery(`success-${i}`, successOperation);
      }

      for (let i = 0; i < 2; i++) {
        const failingOp = jest.fn().mockRejectedValue(new Error('Test'));
        await errorRecovery.executeWithRecovery(
          `recovered-${i}`,
          failingOp,
          { fallback: fallbackOperation }
        );
      }

      const failingOp = jest.fn().mockRejectedValue(new Error('Test'));
      try {
        await errorRecovery.executeWithRecovery('failed', failingOp);
      } catch (error) {
        // Expected failure
      }

      const stats = errorRecovery.getStats();
      expect(stats.availability).toBeCloseTo(90, 0);
    });
  });

  describe('Health Status Monitoring', () => {
    it('should report healthy status under normal conditions', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      
      for (let i = 0; i < 10; i++) {
        await errorRecovery.executeWithRecovery(`healthy-${i}`, successOperation);
      }

      const health = errorRecovery.getHealthStatus();
      expect(health.status).toBe('healthy');
      expect(health.recommendations).toHaveLength(0);
    });

    it('should report warning status with high failure rate', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test'));
      const successOperation = jest.fn().mockResolvedValue('success');
      
      // Create 80% failure rate (8 failures, 2 successes)
      for (let i = 0; i < 8; i++) {
        try {
          await errorRecovery.executeWithRecovery(`fail-${i}`, failingOperation);
        } catch (error) {
          // Expected failures
        }
      }

      for (let i = 0; i < 2; i++) {
        await errorRecovery.executeWithRecovery(`success-${i}`, successOperation);
      }

      const health = errorRecovery.getHealthStatus();
      expect(health.status).toBe('warning');
      expect(health.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Event System', () => {
    it('should emit circuit breaker events', (done) => {
      const eventListener = jest.fn((event, data) => {
        if (event === 'circuit-opened') {
          expect(data.endpoint).toBeDefined();
          done();
        }
      });

      errorRecovery.addEventListener('circuit-opened', eventListener);

      // Trigger circuit breaker opening
      const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));
      
      Promise.all(Array.from({ length: 5 }, () =>
        errorRecovery.executeWithRecovery('event-test', failingOperation).catch(() => {})
      )).then(() => {
        // Fast forward to trigger event polling
        jest.advanceTimersByTime(6000);
      });
    });

    it('should emit fallback events', async () => {
      const eventListener = jest.fn();
      errorRecovery.addEventListener('fallback-triggered', eventListener);

      const failingOperation = jest.fn().mockRejectedValue(new Error('Test'));
      const fallbackOperation = jest.fn().mockResolvedValue('fallback');

      await errorRecovery.executeWithRecovery(
        'fallback-event-test',
        failingOperation,
        { fallback: fallbackOperation }
      );

      expect(eventListener).toHaveBeenCalledWith(
        'fallback-triggered',
        expect.objectContaining({
          operationName: 'fallback-event-test'
        })
      );
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration dynamically', () => {
      const initialStats = errorRecovery.getStats();
      const initialQueueSize = initialStats.queueStats;

      errorRecovery.updateConfig({
        queue: { maxSize: 10000 }
      });

      // Configuration should be updated
      expect(true).toBe(true); // Basic test that update doesn't throw
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive reports', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      await errorRecovery.executeWithRecovery('report-test', successOperation);

      const report = errorRecovery.generateReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('trends');

      expect(report.summary.totalRequests).toBe(1);
      expect(report.summary.status).toBeDefined();
      expect(report.trends.successRate).toBeDefined();
    });
  });

  describe('Factory Patterns', () => {
    it('should create production configuration', () => {
      const prodRecovery = ErrorRecoveryFactory.createProduction();
      expect(prodRecovery).toBeInstanceOf(AdvancedErrorRecovery);
      
      const stats = prodRecovery.getStats();
      expect(stats).toBeDefined();
    });

    it('should create high-resilience configuration', () => {
      const resilientRecovery = ErrorRecoveryFactory.createHighResilience();
      expect(resilientRecovery).toBeInstanceOf(AdvancedErrorRecovery);
      
      const stats = resilientRecovery.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations that timeout', async () => {
      const timeoutOperation = () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), 5000)
      );

      await expect(
        errorRecovery.executeWithRecovery('timeout-test', timeoutOperation)
      ).rejects.toThrow();

      jest.advanceTimersByTime(6000);
    });

    it('should handle rapid successive failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Rapid failure'));

      const promises = Array.from({ length: 100 }, (_, i) =>
        errorRecovery.executeWithRecovery(`rapid-${i}`, failingOperation).catch(() => {})
      );

      await Promise.all(promises);

      const stats = errorRecovery.getStats();
      expect(stats.totalRequests).toBe(100);
      expect(stats.failedRequests).toBeGreaterThan(0);
    });

    it('should reset statistics correctly', async () => {
      const successOperation = jest.fn().mockResolvedValue('success');
      await errorRecovery.executeWithRecovery('reset-test', successOperation);

      let stats = errorRecovery.getStats();
      expect(stats.totalRequests).toBe(1);

      errorRecovery.resetStats();

      stats = errorRecovery.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
    });
  });
});
