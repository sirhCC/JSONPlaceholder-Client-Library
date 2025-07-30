/**
 * JSONPlaceholder Client Library - Validation System Demo
 * Demonstrates the comprehensive request validation and sanitization features
 */

const { JsonPlaceholderClient, ValidationHelpers, RequestValidator, ValidationRules, CommonSchemas } = require('../dist/index.js');

async function demonstrateValidation() {
  console.log('🔒 JSONPlaceholder Client Library - Validation System Demo\n');

  // Initialize client with validation features
  const client = new JsonPlaceholderClient({
    timeout: 5000,
    enableCaching: true,
    enableLogging: true
  });

  console.log('1. 📋 Quick Validation using ValidationHelpers');
  console.log('=' .repeat(50));

  // Test data with security issues
  const unsafePost = {
    title: 'My Blog Post <script>alert("XSS")</script>',
    body: 'Content with SQL injection: \'; DROP TABLE posts; --',
    userId: '123' // String instead of number
  };

  console.log('Input data:', JSON.stringify(unsafePost, null, 2));

  // Validate using built-in helpers
  const postValidation = ValidationHelpers.validatePost(unsafePost);
  console.log('Validation result:', {
    isValid: postValidation.isValid,
    errorCount: postValidation.errors.length,
    hasWarnings: postValidation.warnings && postValidation.warnings.length > 0
  });

  if (postValidation.errors.length > 0) {
    console.log('Validation errors:');
    postValidation.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.field}: ${error.message}`);
    });
  }

  console.log('\n2. 🛡️ Sanitization with Lenient Validator');
  console.log('=' .repeat(50));

  // Use lenient validator for automatic sanitization
  const lenientValidator = ValidationHelpers.createLenientValidator();
  const sanitizedResult = lenientValidator.validate(unsafePost, CommonSchemas.post());

  console.log('Sanitized data:', JSON.stringify(sanitizedResult.sanitizedData, null, 2));
  console.log('Warnings:', sanitizedResult.warnings);

  console.log('\n3. 🔧 Custom Validation Rules');
  console.log('=' .repeat(50));

  // Create custom validator
  const customValidator = new RequestValidator({
    strictMode: false,
    autoSanitize: true,
    allowUnknownFields: true
  });

  const customSchema = {
    email: [
      ValidationRules.required(),
      ValidationRules.email()
    ],
    age: [
      ValidationRules.integer(0, 120)
    ],
    bio: [
      ValidationRules.string(0, 500),
      ValidationRules.safeHtml()
    ]
  };

  const userData = {
    email: 'user@example.com',
    age: 25,
    bio: 'I love coding! <script>alert("hack")</script>',
    extraField: 'This will be allowed'
  };

  const customResult = customValidator.validate(userData, customSchema);
  console.log('Custom validation result:', {
    isValid: customResult.isValid,
    sanitizedData: customResult.sanitizedData
  });

  console.log('\n4. 🚀 Client Integration');
  console.log('=' .repeat(50));

  // Use client's built-in validation methods
  const postToValidate = {
    title: 'Safe Title',
    body: 'Safe content',
    userId: 1
  };

  const clientValidation = client.validatePost(postToValidate);
  console.log('Client validation (safe data):', {
    isValid: clientValidation.isValid,
    errorCount: clientValidation.errors.length
  });

  // Check if data is safe for requests
  const safeCheck = client.isSafeForRequest(postToValidate);
  console.log('Is safe for request:', safeCheck);

  // Sanitize data for API usage
  const sanitized = client.sanitizeForRequest({
    title: 'Title with <script>bad</script> content',
    body: 'Body with SQL injection attempt'
  });
  console.log('Sanitized for request:', sanitized);

  console.log('\n5. 📊 Performance Test');
  console.log('=' .repeat(50));

  // Test validation performance
  const startTime = Date.now();
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    ValidationHelpers.validatePost({
      title: `Post ${i}`,
      body: `Content for post ${i}`,
      userId: i % 10 + 1
    });
  }

  const duration = Date.now() - startTime;
  console.log(`Validated ${iterations} posts in ${duration}ms (${(iterations / duration * 1000).toFixed(0)} validations/sec)`);

  console.log('\n✅ Validation System Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('• XSS and SQL injection protection');
  console.log('• Automatic data sanitization');
  console.log('• Flexible validation rules');
  console.log('• Client integration methods');
  console.log('• High-performance validation');
}

// Run the demo
demonstrateValidation().catch(console.error);
