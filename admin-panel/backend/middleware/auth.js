/**
 * Authentication Middleware
 * Protects admin panel routes with username/password authentication
 */

const { db } = require('../config/database');

const ADMIN_USERNAME = 'admin';
// Password is now stored in Firestore, but keep default for initial setup
const DEFAULT_ADMIN_PASSWORD = 'Admin@Password$%321';

/**
 * Get admin password from Firestore or use default
 */
async function getAdminPassword() {
  try {
    const credsDoc = await db.collection('admin_config').doc('credentials').get();
    if (credsDoc.exists && credsDoc.data().password) {
      return credsDoc.data().password;
    }
    // Return default if not set in Firestore
    return DEFAULT_ADMIN_PASSWORD;
  } catch (error) {
    console.error('Error getting admin password:', error);
    // Fallback to default on error
    return DEFAULT_ADMIN_PASSWORD;
  }
}

/**
 * Simple session storage (in production, use Redis or database)
 * In a real app, you'd use JWT tokens or sessions stored in Redis/database
 */
const activeSessions = new Map();

/**
 * Generate a simple session token
 */
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

/**
 * Verify if a session token is valid
 */
function isValidSession(token) {
  if (!token) return false;
  const session = activeSessions.get(token);
  if (!session) return false;
  
  // Check if session has expired (24 hours)
  const now = Date.now();
  if (now - session.createdAt > 24 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return false;
  }
  
  return true;
}

/**
 * Create a new session
 */
function createSession() {
  const token = generateSessionToken();
  activeSessions.set(token, {
    createdAt: Date.now(),
    username: ADMIN_USERNAME,
  });
  return token;
}

/**
 * Remove a session
 */
function removeSession(token) {
  activeSessions.delete(token);
}

/**
 * Authentication middleware
 * Checks if the request has a valid session token
 */
const authenticate = (req, res, next) => {
  // Allow health check and login endpoints
  if (req.path === '/health' || req.path === '/api/auth/login' || req.path === '/') {
    return next();
  }

  // Get token from Authorization header or cookie
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.cookies?.adminToken || req.headers['x-admin-token'];

  if (!token || !isValidSession(token)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login to access the admin panel.',
      requiresAuth: true,
    });
  }

  // Add user info to request
  const session = activeSessions.get(token);
  req.adminUser = {
    username: session.username,
    token: token,
  };

  next();
};

module.exports = {
  authenticate,
  createSession,
  removeSession,
  isValidSession,
  getAdminPassword,
  ADMIN_USERNAME,
  DEFAULT_ADMIN_PASSWORD,
};

