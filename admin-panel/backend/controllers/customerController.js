const { db } = require('../config/database');
const Customer = require('../models/Customer');

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    // Fetch from 'users' collection (AppUser in .NET maps to 'users' in Firestore typically)
    // If your collection is named differently, adjust accordingly
    const usersSnapshot = await db.collection('users').get();
    const customers = [];

    usersSnapshot.forEach((doc) => {
      const customer = Customer.fromFirestore(doc);
      customers.push(customer);
    });

    // Sort by createdAt descending (newest first)
    customers.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB - dateA;
    });

    res.json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerDoc = await db.collection('users').doc(id).get();

    if (!customerDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const customer = Customer.fromFirestore(customerDoc);
    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
};

