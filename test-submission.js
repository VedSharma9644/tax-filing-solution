// Test script for tax form submission
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

// Test data
const testFormData = {
  socialSecurityNumber: '123-45-6789',
  documents: [
    {
      id: 'doc1',
      name: 'test-w2.pdf',
      type: 'application/pdf',
      size: 1024,
      category: 'w2Forms',
      gcsPath: 'test/w2/test-w2.pdf',
      publicUrl: 'https://storage.googleapis.com/test-bucket/test/w2/test-w2.pdf',
      timestamp: new Date().toISOString()
    }
  ],
  dependents: [
    {
      id: 'dep1',
      name: 'John Doe',
      age: '25',
      relationship: 'spouse'
    }
  ],
  formType: '1040',
  taxYear: 2024,
  filingStatus: 'married_filing_jointly'
};

async function testTaxFormSubmission() {
  try {
    console.log('🧪 Testing tax form submission...');
    
    // First, get a test token (you'll need to replace this with actual auth flow)
    const testToken = 'your-test-token-here';
    
    if (testToken === 'your-test-token-here') {
      console.log('❌ Please replace testToken with a valid token from your auth flow');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/tax-forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify(testFormData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Tax form submission successful!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Tax form submission failed');
      console.log('📋 Error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check successful!');
      console.log('📋 Status:', result.status);
    } else {
      console.log('❌ Health check failed');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

async function testDatabaseConnection() {
  try {
    console.log('🗄️ Testing database connection...');
    
    const response = await fetch(`${API_BASE_URL}/test-db`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Database connection successful!');
      console.log('📋 Project ID:', result.projectId);
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Tax Filing App Tests...\n');
  
  await testHealthCheck();
  console.log('');
  
  await testDatabaseConnection();
  console.log('');
  
  await testTaxFormSubmission();
  console.log('');
  
  console.log('🏁 Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testTaxFormSubmission,
  testHealthCheck,
  testDatabaseConnection,
  runTests
};
