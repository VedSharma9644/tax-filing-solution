#!/usr/bin/env node

/**
 * Test script to verify deployment
 * Usage: node test-deployment.js [URL]
 */

const https = require('https');
const http = require('http');

const testUrl = process.argv[2] || 'http://localhost:5000';

console.log(`🧪 Testing deployment at: ${testUrl}`);

const isHttps = testUrl.startsWith('https://');
const client = isHttps ? https : http;

// Test health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const req = client.get(`${testUrl}/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'healthy') {
            console.log('✅ Health check passed');
            resolve(response);
          } else {
            console.log('❌ Health check failed:', response);
            reject(new Error('Health check failed'));
          }
        } catch (error) {
          console.log('❌ Invalid JSON response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health check request failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Health check timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test root endpoint
function testRoot() {
  return new Promise((resolve, reject) => {
    const req = client.get(testUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.message) {
            console.log('✅ Root endpoint passed');
            resolve(response);
          } else {
            console.log('❌ Root endpoint failed:', response);
            reject(new Error('Root endpoint failed'));
          }
        } catch (error) {
          console.log('❌ Invalid JSON response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Root endpoint request failed:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log('❌ Root endpoint timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Run tests
async function runTests() {
  try {
    console.log('🚀 Starting deployment tests...\n');
    
    await testHealth();
    await testRoot();
    
    console.log('\n🎉 All tests passed! Your deployment is working correctly.');
    console.log(`🌐 Your backend is live at: ${testUrl}`);
    
  } catch (error) {
    console.log('\n❌ Tests failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the service is running');
    console.log('2. Verify the URL is correct');
    console.log('3. Check logs for errors');
    console.log('4. Ensure all environment variables are set');
    
    process.exit(1);
  }
}

runTests();
