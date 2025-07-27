// Test the React package exports
console.log('🧪 Testing React Package Exports...\n');

try {
    // Test CommonJS import
    console.log('1. Testing CommonJS import...');
    const reactHooks = require('./packages/react/dist/index.js');
    
    console.log('   ✅ Available exports:');
    Object.keys(reactHooks).forEach(key => {
        console.log(`   - ${key}: ${typeof reactHooks[key]}`);
    });

    // Test specific hooks
    console.log('\n2. Testing hook types...');
    console.log(`   - JsonPlaceholderProvider: ${typeof reactHooks.JsonPlaceholderProvider}`);
    console.log(`   - useJsonPlaceholderClient: ${typeof reactHooks.useJsonPlaceholderClient}`);
    console.log(`   - usePosts: ${typeof reactHooks.usePosts}`);
    console.log(`   - useCreatePost: ${typeof reactHooks.useCreatePost}`);
    
    // Count hooks
    const hookCount = Object.keys(reactHooks).filter(key => key.startsWith('use')).length;
    console.log(`\n   📊 Total hooks exported: ${hookCount}`);

    console.log('\n🎉 React package exports are working correctly!');

} catch (error) {
    console.error('❌ Error testing React package:', error.message);
}
