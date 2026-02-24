/**
 * Diagnostic script to test Tidig API connectivity
 * 
 * Usage: npx tsx src/scripts/test-tidig-connection.ts
 */

import 'dotenv/config';
import axios from 'axios';

const TIDIG_API_URL = process.env.TIDIG_API_URL;
const TIDIG_API_KEY = process.env.TIDIG_API_KEY;

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 Tidig API Connection Diagnostic');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Configuration:');
console.log(`  API URL: ${TIDIG_API_URL}`);
console.log(`  API Key: ${TIDIG_API_KEY ? '***' + TIDIG_API_KEY.slice(-8) : 'NOT SET'}`);
console.log('');

if (!TIDIG_API_URL || !TIDIG_API_KEY) {
  console.error('❌ Missing configuration!');
  console.error('   Please set TIDIG_API_URL and TIDIG_API_KEY in backend/.env');
  process.exit(1);
}

async function testConnection() {
  console.log('Step 1: Testing DNS resolution...');
  try {
    const url = new URL(TIDIG_API_URL!);
    const hostname = url.hostname;
    console.log(`  Hostname: ${hostname}`);
    
    // Try to resolve the hostname
    const dns = await import('dns');
    const { promisify } = await import('util');
    const lookup = promisify(dns.lookup);
    
    try {
      const address = await lookup(hostname);
      console.log(`  ✓ DNS resolved to: ${address.address}`);
    } catch (dnsError: any) {
      console.error(`  ✗ DNS resolution failed: ${dnsError.message}`);
      console.error('');
      console.error('  This means the hostname cannot be found.');
      console.error('  Possible solutions:');
      console.error('    1. Verify the correct Tidig API URL');
      console.error('    2. Check if you need to use a different hostname');
      console.error('    3. Verify network/VPN connection if required');
      console.error('');
      return false;
    }
  } catch (error: any) {
    console.error(`  ✗ Invalid URL: ${error.message}`);
    return false;
  }

  console.log('');
  console.log('Step 2: Testing HTTP connection...');
  try {
    const response = await axios.get(`${TIDIG_API_URL}/Api/Time`, {
      headers: {
        'x-apikey': TIDIG_API_KEY!,
      },
      timeout: 5000,
    });
    console.log(`  ✓ Connection successful! Status: ${response.status}`);
    console.log(`  Response data: ${JSON.stringify(response.data).substring(0, 100)}...`);
    return true;
  } catch (error: any) {
    if (error.response) {
      console.error(`  ✗ Server returned error: ${error.response.status}`);
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('  This means authentication failed.');
        console.error('  Please verify your TIDIG_API_KEY is correct.');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('  ✗ Connection timeout (>5 seconds)');
    } else {
      console.error(`  ✗ Connection failed: ${error.message}`);
      console.error(`  Error code: ${error.code}`);
    }
    return false;
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('');

testConnection().then((success) => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  if (success) {
    console.log('✅ All tests passed! Tidig API is accessible.');
  } else {
    console.log('❌ Connection test failed. See errors above.');
  }
  console.log('═══════════════════════════════════════════════════════════');
  process.exit(success ? 0 : 1);
});
