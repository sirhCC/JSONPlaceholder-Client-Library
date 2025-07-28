/**
 * Simple Error Recovery Test
 */

import { CircuitBreaker } from '../error-recovery';

describe('Error Recovery System - Simple', () => {
  it('should import CircuitBreaker successfully', () => {
    const circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      timeout: 5000,
      resetTimeout: 10000
    });
    
    expect(circuitBreaker).toBeDefined();
    expect(circuitBreaker.getStats().state).toBe('CLOSED');
  });
});
