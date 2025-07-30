import { RateLimiter } from '../rate-limiter';

async function testTokenBucket() {
  const rateLimiter = new RateLimiter({
    enabled: true,
    strategy: 'token-bucket',
    maxRequests: 3,
    windowMs: 1000,
    maxQueueSize: 0, // Disable queueing to test raw rate limiting
    enableAnalytics: true
  });

  console.log('Testing Token Bucket Strategy (No Queue)');
  
  // Access the private globalState to see what's happening
  const state = (rateLimiter as any).globalState;
  console.log('Initial state:', state);
  
  // Test 1: Check initial tokens
  const result1 = await rateLimiter.checkLimit('/test');
  console.log('Request 1:', result1);
  console.log('State after request 1:', state);
  
  const result2 = await rateLimiter.checkLimit('/test');
  console.log('Request 2:', result2);
  console.log('State after request 2:', state);
  
  const result3 = await rateLimiter.checkLimit('/test');
  console.log('Request 3:', result3);
  console.log('State after request 3:', state);
  
  // This should be blocked
  const result4 = await rateLimiter.checkLimit('/test');
  console.log('Request 4 (should be blocked):', result4);
  console.log('State after request 4:', state);
  
  // Wait a bit and try again
  console.log('\nWaiting 400ms for partial refill...');
  await new Promise(resolve => setTimeout(resolve, 400));
  const result5 = await rateLimiter.checkLimit('/test');
  console.log('Request 5 (after 400ms):', result5);
  console.log('State after request 5:', state);
  
  console.log('\nAnalytics:', rateLimiter.getAnalytics());
}

testTokenBucket().catch(console.error);
