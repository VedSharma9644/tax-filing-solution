const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

// Test the admin upload endpoint with encryption
async function testEncryption() {
  try {
    console.log('🧪 Testing admin upload encryption...');
    
    // Create a test PDF file (you can replace this with any PDF file)
    const testFile = 'test-document.pdf';
    
    // Check if test file exists
    if (!fs.existsSync(testFile)) {
      console.log('❌ Test file not found. Please create a test-document.pdf file');
      console.log('   Or replace the testFile variable with an existing PDF file');
      return;
    }
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    form.append('applicationId', 'test-app-123');
    form.append('returnType', 'draft');
    
    // Admin credentials (you'll need to get a real admin token)
    const adminToken = 'your-admin-token-here'; // Replace with real token
    
    console.log('📤 Uploading test file...');
    
    const response = await fetch('http://localhost:5001/admin/upload/return', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('📁 File details:', {
        fileName: result.fileName,
        gcsPath: result.gcsPath,
        size: result.size,
        contentType: result.contentType
      });
      console.log('🔐 File should be encrypted in GCS');
    } else {
      console.log('❌ Upload failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testEncryption();
