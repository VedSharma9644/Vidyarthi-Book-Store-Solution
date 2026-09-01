const { db } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const ALLOWED_USER_UPDATE_FIELDS = new Set([
    'userName',
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'phoneNumberConfirmed',
    'schoolName',
    'classStandard',
    'roleName',
    'address',
    'addresses',
    'students',
    'profileImageUrl',
    'password',
]);

function pickAllowedUserUpdateFields(updateData) {
    const out = {};
    if (!updateData || typeof updateData !== 'object') return out;
    for (const key of ALLOWED_USER_UPDATE_FIELDS) {
        if (updateData[key] !== undefined) {
            out[key] = updateData[key];
        }
    }
    return out;
}

class UserService {
    constructor() {
        this.usersRef = db.collection('users');
    }

    /**
     * Resolve Firestore user doc when :id is missing (stale client id).
     * @returns {Promise<{ ref: FirebaseFirestore.DocumentReference, id: string }|null>}
     */
    async resolveUserDocForUpdate(userId, hints = {}) {
        const ref = this.usersRef.doc(userId);
        const snap = await ref.get();
        if (snap.exists) {
            return { ref, id: userId };
        }

        const phone = hints.phoneNumber && String(hints.phoneNumber).trim();
        if (phone) {
            const byPhone = await this.getUserByPhoneNumber(phone);
            if (byPhone?.id) {
                return { ref: this.usersRef.doc(byPhone.id), id: byPhone.id };
            }
        }

        const email = hints.email && String(hints.email).trim().toLowerCase();
        if (email) {
            const byEmail = await this.getUserByEmail(email);
            if (byEmail?.id) {
                return { ref: this.usersRef.doc(byEmail.id), id: byEmail.id };
            }
        }

        return null;
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
                userName,
                email,
                password,
                schoolName,
                classStandard,
                roleName = 'Customer',
            } = userData;

            // Check if user already exists by phone or email
            if (mobileNumber) {
                const existingUser = await this.getUserByPhoneNumber(mobileNumber);
                if (existingUser) {
                    throw new Error('User already exists with this phone number');
                }
            }
            
            if (email) {
                const existingUser = await this.getUserByEmail(email);
                if (existingUser) {
                    throw new Error('User already exists with this email');
                }
            }

            // Create user document
            // Use provided userName, or construct from firstName+lastName, or fallback to phone/email
            let finalUserName = userName;
            if (!finalUserName && firstName && lastName) {
                finalUserName = `${firstName} ${lastName}`.trim();
            } else if (!finalUserName && firstName) {
                finalUserName = firstName;
            } else if (!finalUserName && lastName) {
                finalUserName = lastName;
            } else if (!finalUserName) {
                // Fallback to phone number or email prefix
                finalUserName = mobileNumber ? mobileNumber.replace('+91', '') : (email ? email.split('@')[0] : 'User');
            }
            
            const userDoc = {
                userName: finalUserName,
                phoneNumber: mobileNumber || null,
                phoneNumberConfirmed: !!mobileNumber,
                firstName: firstName || null,
                lastName: lastName || null,
                email: email || null,
                password: password || null, // Store hashed password
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
     * Get user by email
     * @param {string} email - User email address
     * @returns {Promise<object|null>} - User object or null
     */
    async getUserByEmail(email) {
        try {
            const snapshot = await this.usersRef
                .where('email', '==', email.toLowerCase().trim())
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
            console.error('Error getting user by email:', error);
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
            const sanitized = pickAllowedUserUpdateFields(updateData);
            if (Object.keys(sanitized).length === 0) {
                const err = new Error('No valid fields to update');
                err.code = 'INVALID_UPDATE';
                throw err;
            }

            // Log address updates for debugging
            if (sanitized.addresses && Array.isArray(sanitized.addresses)) {
                console.log(`📍 Updating user ${userId} with ${sanitized.addresses.length} address(es)`);
                sanitized.addresses.forEach((addr, index) => {
                    console.log(`  Address ${index + 1}: ${addr.name || 'Unnamed'}, ${addr.city || 'No city'}, ${addr.isDefault ? '(Default)' : ''}`);
                });
            }

            const resolved = await this.resolveUserDocForUpdate(userId, {
                phoneNumber: sanitized.phoneNumber || updateData.phoneNumber,
                email: sanitized.email || updateData.email,
            });

            if (!resolved) {
                const err = new Error(
                    'User profile not found. Please log out and sign in again with your phone or email.'
                );
                err.code = 'USER_NOT_FOUND';
                throw err;
            }

            const { ref, id: resolvedId } = resolved;
            sanitized.updatedAt = Timestamp.now();

            await ref.update(sanitized);

            if (resolvedId !== userId) {
                console.warn(
                    `⚠️ User update: client id ${userId} not found; updated Firestore user ${resolvedId} instead`
                );
            } else {
                console.log(`✅ User ${resolvedId} updated successfully`);
            }

            const user = await this.getUserById(resolvedId);
            return {
                user,
                correctedUserId: resolvedId !== userId ? resolvedId : null,
            };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
}

module.exports = new UserService();

