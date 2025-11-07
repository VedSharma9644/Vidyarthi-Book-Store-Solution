// Test script for Book API
const axios = require('axios');
const { db } = require('./config/database');

const API_BASE_URL = 'http://localhost:5000';

async function getOrCreateTestCategory() {
  try {
    // First, try to get an existing category
    const categoriesSnapshot = await db.collection('categories').limit(1).get();
    
    if (!categoriesSnapshot.empty) {
      const categoryDoc = categoriesSnapshot.docs[0];
      console.log('✅ Found existing category:', categoryDoc.id);
      return categoryDoc.id;
    }

    // If no categories exist, create a test category
    console.log('⚠️  No categories found. Creating a test category...');
    
    // First, get or create a grade
    let gradeId = null;
    const gradesSnapshot = await db.collection('grades').limit(1).get();
    
    if (!gradesSnapshot.empty) {
      gradeId = gradesSnapshot.docs[0].id;
    } else {
      // Create a test grade
      const schoolsSnapshot = await db.collection('schools').limit(1).get();
      let schoolId = null;
      
      if (!schoolsSnapshot.empty) {
        schoolId = schoolsSnapshot.docs[0].id;
      } else {
        // Create a minimal test school
        const testSchool = {
          name: 'Test School for Book',
          branchName: 'Test Branch',
          code: `TEST-SCH-BOOK-${Date.now()}`,
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
        name: 'Test Grade for Book',
        schoolId: schoolId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const gradeRef = await db.collection('grades').add(testGrade);
      gradeId = gradeRef.id;
      console.log('✅ Created test grade:', gradeId);
    }

    // Create a test category
    const testCategory = {
      name: 'Test Category for Book',
      description: 'Test category for book testing',
      imageUrl: '',
      gradeId: gradeId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const categoryRef = await db.collection('categories').add(testCategory);
    console.log('✅ Created test category:', categoryRef.id);
    return categoryRef.id;
  } catch (error) {
    console.error('❌ Error getting/creating category:', error.message);
    throw error;
  }
}

async function testCreateBook() {
  try {
    console.log('🧪 Testing Create Book API...\n');

    // Get or create a test category
    const categoryId = await getOrCreateTestCategory();
    console.log('Using categoryId:', categoryId);
    console.log('');

    // Use frontend field names (Title, Author, etc.) to match the form
    const testBook = {
      Title: 'Test Book Title',
      Author: 'Test Author Name',
      Publisher: 'Test Publisher',
      ISBN: '978-0-123456-78-9',
      Description: 'This is a test book description for API testing',
      Price: '299.99',
      DiscountPrice: '249.99',
      StockQuantity: '50',
      BookType: 'TEXTBOOK',
      CategoryId: categoryId,
      CoverImageUrl: 'https://example.com/book-cover.jpg',
      IsFeatured: false,
      PublicationDate: new Date().toISOString(),
    };

    console.log('📤 Sending POST request to /api/books');
    console.log('Request data:', JSON.stringify(testBook, null, 2));
    console.log('\n');

    const response = await axios.post(`${API_BASE_URL}/api/books`, testBook);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Book created successfully!');
      console.log('Book ID:', response.data.data.id);
      console.log('Book Title:', response.data.data.title);
      return response.data.data.id;
    } else {
      console.log('\n❌ Failed to create book');
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

async function testGetAllBooks() {
  try {
    console.log('\n🧪 Testing Get All Books API...\n');

    const response = await axios.get(`${API_BASE_URL}/api/books`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Total books:', response.data.count);
    if (response.data.data.length > 0) {
      console.log('Books:');
      response.data.data.forEach((book, index) => {
        console.log(`  ${index + 1}. ${book.title} by ${book.author} (ID: ${book.id})`);
      });
    } else {
      console.log('No books found.');
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

async function testGetBookById(bookId) {
  if (!bookId) {
    console.log('\n⚠️  Skipping Get Book By ID test (no book ID available)');
    return;
  }

  try {
    console.log(`\n🧪 Testing Get Book By ID API (ID: ${bookId})...\n`);

    const response = await axios.get(`${API_BASE_URL}/api/books/${bookId}`);

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Book:', JSON.stringify(response.data.data, null, 2));
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
  console.log('Book API Test Suite');
  console.log('='.repeat(50));
  console.log('\n');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  await testGetAllBooks();
  const bookId = await testCreateBook();
  await testGetBookById(bookId);
  await testGetAllBooks();

  console.log('\n' + '='.repeat(50));
  console.log('Tests completed!');
  console.log('='.repeat(50));
  
  // Close database connection
  process.exit(0);
}

runTests();

