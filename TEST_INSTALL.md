# Test Package Installation

To verify the published package works correctly, run this test after publishing:

```bash
# Create test directory
mkdir test-install && cd test-install

# Initialize npm project
npm init -y

# Install the published package
npm install jsonplaceholder-client-lib

# Test CommonJS
node -e "
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');
const client = new JsonPlaceholderClient();
console.log('✅ CommonJS import successful');
console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).length);
"

# Test ES Modules
echo "
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
const client = new JsonPlaceholderClient();
console.log('✅ ES Module import successful');
" > test.mjs && node test.mjs

echo "🎉 Package installation test completed!"
```
