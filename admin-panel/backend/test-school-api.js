// Test script for School API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCreateSchool() {
  try {
    console.log('🧪 Testing Create School API...\n');

    const testSchool = {
      name: 'Test School API',
      branchName: 'Test Branch',
      code: 'TEST001',
      board: 'CBSE',
      address: '123 Test Street, Test Area',
      city: 'Test City',
      state: 'Test State',
      phoneNumber: '1234567890',
      email: 'test@school.com',
      schoolLogo: 'https://example.com/logo.png'
    };

    console.log('📤 Sending POST request to /api/schools');
    console.log('Request data:', JSON.stringify(testSchool, null, 2));
    console.log('\n');

    const response = await axios.post(`${API_BASE_URL}/api/schools`, testSchool);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ School created successfully!');
      console.log('School ID:', response.data.data.id);
    } else {
      console.log('\n❌ Failed to create school');
      console.log('Error:', response.data.message);
    }
  } catch (error) {
    console.error('\n❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

async function testGetAllSchools() {
  try {
    console.log('\n🧪 Testing Get All Schools API...\n');

    const response = await axios.get(`${API_BASE_URL}/api/schools`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Total schools:', response.data.count);
    console.log('Schools:', JSON.stringify(response.data.data, null, 2));
  } catch (error) {
    console.error('\n❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('School API Test Suite');
  console.log('='.repeat(50));
  console.log('\n');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testCreateSchool();
  await testGetAllSchools();

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
}

runTests();

