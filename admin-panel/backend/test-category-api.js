// Test script for Category API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testGetAllCategories() {
  try {
    console.log('🧪 Testing Get All Categories API...\n');

    const response = await axios.get(`${API_BASE_URL}/api/categories`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Total categories:', response.data.count);
    if (response.data.data.length > 0) {
      console.log('Categories:', JSON.stringify(response.data.data, null, 2));
    } else {
      console.log('No categories found.');
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

async function testGetGrades() {
  try {
    // Try to get grades from Firestore directly via a simple query
    // For now, we'll use a test gradeId - in production, this should be a valid grade ID
    console.log('⚠️  Note: Using a test gradeId. In production, use a valid grade ID from the grades collection.');
    return 'test-grade-id-for-validation';
  } catch (error) {
    console.log('⚠️  Could not fetch grades. Will use a test gradeId.');
    return 'test-grade-id-for-validation';
  }
}

async function testCreateCategory() {
  try {
    console.log('🧪 Testing Create Category API...\n');

    // Try to get a valid gradeId first
    let gradeId = await testGetGrades();
    
    // If no grades found, we'll use a test ID (this will fail validation, but we'll see the error)
    if (!gradeId) {
      console.log('⚠️  No grades found. Using test gradeId (this may fail validation).');
      gradeId = 'test-grade-id';
    }

    const testCategory = {
      name: 'Test Book Category',
      description: 'This is a test category for books',
      imageUrl: 'https://example.com/category-image.png',
      gradeId: gradeId,
    };

    console.log('📤 Sending POST request to /api/categories');
    console.log('Request data:', JSON.stringify(testCategory, null, 2));
    console.log('\n');

    const response = await axios.post(`${API_BASE_URL}/api/categories`, testCategory);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Category created successfully!');
      console.log('Category ID:', response.data.data.id);
      return response.data.data.id;
    } else {
      console.log('\n❌ Failed to create category');
      console.log('Error:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('\n❌ Error testing API:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    return null;
  }
}

async function testGetCategoryById(categoryId) {
  if (!categoryId) {
    console.log('\n⚠️  Skipping Get Category By ID test (no category ID available)');
    return;
  }

  try {
    console.log(`\n🧪 Testing Get Category By ID API (ID: ${categoryId})...\n`);

    const response = await axios.get(`${API_BASE_URL}/api/categories/${categoryId}`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Category:', JSON.stringify(response.data.data, null, 2));
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
  console.log('Category API Test Suite');
  console.log('='.repeat(50));
  console.log('\n');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testGetAllCategories();
  const categoryId = await testCreateCategory();
  await testGetCategoryById(categoryId);
  await testGetAllCategories();

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
}

runTests();

