// Test script for Category API with Grade creation
const axios = require('axios');
const { db } = require('./config/database');

const API_BASE_URL = 'http://localhost:5000';

async function getOrCreateTestGrade() {
  try {
    // First, try to get an existing grade
    const gradesSnapshot = await db.collection('grades').limit(1).get();
    
    if (!gradesSnapshot.empty) {
      const gradeDoc = gradesSnapshot.docs[0];
      console.log('✅ Found existing grade:', gradeDoc.id);
      return gradeDoc.id;
    }

    // If no grades exist, create a test grade
    console.log('⚠️  No grades found. Creating a test grade...');
    
    // First, get a school to associate with the grade
    const schoolsSnapshot = await db.collection('schools').limit(1).get();
    let schoolId = null;
    
    if (!schoolsSnapshot.empty) {
      schoolId = schoolsSnapshot.docs[0].id;
    } else {
      console.log('⚠️  No schools found. Creating a test school first...');
      // Create a minimal test school
      const testSchool = {
        name: 'Test School for Grade',
        branchName: 'Test Branch',
        code: `TEST-SCH-${Date.now()}`,
        board: 'CBSE',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        phoneNumber: '1234567890',
        email: 'test@school.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const schoolRef = await db.collection('schools').add(testSchool);
      schoolId = schoolRef.id;
      console.log('✅ Created test school:', schoolId);
    }

    // Create a test grade
    const testGrade = {
      name: 'Test Grade for Category',
      schoolId: schoolId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const gradeRef = await db.collection('grades').add(testGrade);
    console.log('✅ Created test grade:', gradeRef.id);
    return gradeRef.id;
  } catch (error) {
    console.error('❌ Error getting/creating grade:', error.message);
    throw error;
  }
}

async function testCreateCategory() {
  try {
    console.log('🧪 Testing Create Category API...\n');

    // Get or create a test grade
    const gradeId = await getOrCreateTestGrade();
    console.log('Using gradeId:', gradeId);
    console.log('');

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
      console.log('Category Name:', response.data.data.name);
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

async function testGetAllCategories() {
  try {
    console.log('\n🧪 Testing Get All Categories API...\n');

    const response = await axios.get(`${API_BASE_URL}/api/categories`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Total categories:', response.data.count);
    if (response.data.data.length > 0) {
      console.log('Categories:');
      response.data.data.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (ID: ${cat.id})`);
      });
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
  console.log('Category API Test Suite (with Grade creation)');
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
  
  // Close database connection
  process.exit(0);
}

runTests();

