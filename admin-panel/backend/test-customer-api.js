// Test script for Customer API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testGetAllCustomers() {
  try {
    console.log('🧪 Testing Get All Customers API...\n');

    const response = await axios.get(`${API_BASE_URL}/api/customers`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Total customers:', response.data.count);
    if (response.data.data.length > 0) {
      console.log('\nFirst 5 customers:');
      response.data.data.slice(0, 5).forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.parentFullName || 'N/A'} - ${customer.email || 'N/A'} - ${customer.phoneNumber || 'N/A'}`);
        console.log(`     Created At: ${customer.createdAt} (type: ${typeof customer.createdAt})`);
      });
    } else {
      console.log('No customers found.');
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

// Run tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('Customer API Test Suite');
  console.log('='.repeat(50));
  console.log('\n');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testGetAllCustomers();

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
  
  process.exit(0);
}

runTests();

