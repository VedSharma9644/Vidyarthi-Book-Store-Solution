const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

class UserService {
    constructor() {
        this.usersRef = db.collection('users');
    }

    /**
     * Create a new user in Firestore
     * @param {object} userData - User data
     * @returns {Promise<object>} - Created user with ID
     */
    async createUser(userData) {
        try {
            const {
                mobileNumber,
                firstName,
                lastName,
                email,
                schoolName,
                classStandard,
                roleName = 'Customer',
            } = userData;

            // Check if user already exists
            const existingUser = await this.getUserByPhoneNumber(mobileNumber);
            if (existingUser) {
                throw new Error('User already exists with this phone number');
            }

            // Create user document
            const userDoc = {
                userName: mobileNumber.replace('+91', ''), // Store without +91 prefix
                phoneNumber: mobileNumber,
                phoneNumberConfirmed: true,
                firstName: firstName || null,
                lastName: lastName || null,
                email: email || null,
                schoolName: schoolName || null,
                classStandard: classStandard || null,
                roleName: roleName,
                address: {
                    address: null,
                    city: null,
                    state: null,
                    postalCode: null,
                    country: null,
                },
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            // Add to Firestore
            const docRef = await this.usersRef.add(userDoc);
            
            console.log(`✅ User created in Firestore with ID: ${docRef.id}`);
            
            return {
                id: docRef.id,
                ...userDoc,
            };
        } catch (error) {
            console.error('Error creating user in Firestore:', error);
            throw error;
        }
    }

    /**
     * Get user by phone number
     * @param {string} phoneNumber - Phone number in +91XXXXXXXXXX format
     * @returns {Promise<object|null>} - User object or null
     */
    async getUserByPhoneNumber(phoneNumber) {
        try {
            const snapshot = await this.usersRef
                .where('phoneNumber', '==', phoneNumber)
                .limit(1)
                .get();

            if (snapshot.empty) {
                return null;
            }

            const doc = snapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error getting user by phone number:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     * @param {string} userId - User document ID
     * @returns {Promise<object|null>} - User object or null
     */
    async getUserById(userId) {
        try {
            const doc = await this.usersRef.doc(userId).get();
            
            if (!doc.exists) {
                return null;
            }

            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    /**
     * Update user
     * @param {string} userId - User document ID
     * @param {object} updateData - Data to update
     * @returns {Promise<object>} - Updated user
     */
    async updateUser(userId, updateData) {
        try {
            updateData.updatedAt = Timestamp.now();
            
            await this.usersRef.doc(userId).update(updateData);
            
            return await this.getUserById(userId);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
}

module.exports = new UserService();

