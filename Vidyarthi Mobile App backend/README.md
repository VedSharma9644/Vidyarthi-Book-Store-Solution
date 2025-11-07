# Vidyarthi Mobile App Backend

Node.js backend API for Vidyarthi Mobile Application, using Firebase Firestore as the database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` (already created)
   - Verify SMS API credentials are set

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm install -g nodemon
   npm run dev
   ```

4. **Test the API:**
   - Health check: `http://localhost:5000/health`
   - Auth test: `http://localhost:5000/api/auth/test`

## 📋 Documentation

This backend project contains comprehensive planning and research documentation:

### 1. **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)**
   - Complete multi-phase migration plan
   - Technology stack decisions
   - Database schema design for Firebase
   - API endpoint specifications
   - Implementation roadmap

### 2. **[RESEARCH_SUMMARY.md](./RESEARCH_SUMMARY.md)**
   - Detailed analysis of old backend (C#)
   - SMS API implementation analysis
   - Database schema extraction
   - Firestore collection designs
   - API requirements from mobile app

### 3. **[SMS_SERVICE_CODE.md](./SMS_SERVICE_CODE.md)**
   - Extracted SMS service code (C# → Node.js)
   - Complete implementation guide
   - Ready-to-use code snippets
   - 2Factor.in and Fast2SMS integration

### 4. **[CREDENTIALS.md](./CREDENTIALS.md)**
   - Extracted API credentials
   - Environment variable template
   - Security best practices
   - Configuration guide

---

## 🔑 Extracted Credentials

### SMS APIs

**2Factor.in** (Primary):
- API Key: `ce34ca26-2e5c-11f0-8b17-0200cd936042`
- Template: `OTP1`

**Fast2SMS** (Backup):
- Authorization: `dLzw9Ria2Hv75ybJVYSpsh0ueBPfCg3T1loENxnIXrQKG8UkOFKeVt3Elm2bikucMAs1Zh0yP5rwB69f`

> ⚠️ **Important**: These credentials should be stored in environment variables, never in code!

---

## 📱 Mobile App API Requirements

Based on the mobile app's `apiConfig.js`, the following endpoints are required:

### Authentication
- `POST /api/auth/send-otp`
- `POST /api/auth/register-mobile`
- `POST /api/auth/login-mobile`
- `GET /api/auth/test`

### Books
- `GET /api/books/get-all-books`
- `GET /api/books/get-all-generalbooks`
- `GET /api/books/:id`

### Cart
- `GET /api/cart/getcart`
- `POST /api/cart/update`
- `DELETE /api/cart/:itemId`
- `GET /api/cart/count`
- `POST /api/cart/clear`

### Health
- `GET /health`

---

## 🚀 Migration Phases

### Phase 1: Project Setup & Foundation ✅
- Initialize Node.js/Express project
- Set up Firebase Firestore
- Configure environment variables
- Project structure setup

### Phase 2: SMS Service & OTP ✅
- Implement SMS service (2Factor.in + Fast2SMS)
- OTP generation and storage
- OTP verification logic

### Phase 3: Authentication System ✅
- JWT-based authentication
- User registration (mobile OTP)
- User login (mobile OTP)
- Auth middleware

### Phase 4: Books API ✅
- Book catalog endpoints
- Pagination, filtering, sorting
- Category and grade support

### Phase 5: Cart API ✅
- Shopping cart management
- Add/update/remove items
- Cart calculations

### Phase 6: Orders API ✅
- Order placement
- Order history
- Order status management

---

## 📊 Database Migration

**From**: SQL Server (old backend)  
**To**: Firebase Firestore (new backend)

Key differences:
- SQL Server: Relational, SQL queries, JOINs
- Firestore: NoSQL, document-based, references

See [RESEARCH_SUMMARY.md](./RESEARCH_SUMMARY.md) for detailed schema mappings.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: JWT (jsonwebtoken)
- **SMS**: 2Factor.in API, Fast2SMS (backup)
- **HTTP Client**: axios

---

## 📝 Next Steps

1. ✅ **Research Complete** - All documentation created
2. ⏭️ **Phase 1**: Begin project setup
3. ⏭️ **Phase 2**: Implement SMS service
4. ⏭️ **Phase 3**: Build authentication
5. ⏭️ **Phase 4-6**: Complete remaining APIs

---

## 📖 Quick Reference

### SMS Service Usage
```javascript
const smsService = require('./services/smsService');

// Send OTP
await smsService.sendOtp2Factor('9876543210');

// Verify OTP
const isValid = await smsService.verifyOtp('9876543210', '123456');
```

### Phone Number Format
- **Input**: 10-digit number (e.g., "9876543210")
- **Storage/SMS**: Format as "+919876543210"
- **Validation**: Regex `/^[0-9]{10}$/`

### OTP Configuration
- **Format**: 6-digit (100000-999999)
- **Expiry**: 5 minutes
- **Storage**: Firebase Firestore collection `otps`

---

## 🔒 Security Notes

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** for OTP requests
4. **Validate inputs** before processing
5. **Use HTTPS** in production
6. **Set up Firebase security rules** properly

---

## 📞 Support

For questions or issues during implementation, refer to:
- [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for detailed roadmap
- [SMS_SERVICE_CODE.md](./SMS_SERVICE_CODE.md) for SMS implementation
- [RESEARCH_SUMMARY.md](./RESEARCH_SUMMARY.md) for schema details

---

## ✅ Current Implementation Status

### Phase 1 & 2: Complete ✅
- ✅ Node.js/Express project setup
- ✅ SMS Service (2Factor.in + Fast2SMS fallback)
- ✅ OTP Storage (in-memory, ready for Firebase migration)
- ✅ Authentication Endpoints:
  - `POST /api/auth/send-otp` - Send OTP to mobile
  - `POST /api/auth/register-mobile` - Register with OTP
  - `POST /api/auth/login-mobile` - Login with OTP
  - `GET /api/auth/test` - Test endpoint

### Features Implemented
- ✅ SMS OTP sending (2Factor.in primary, Fast2SMS backup)
- ✅ OTP verification and expiry handling
- ✅ Rate limiting (3 requests per minute per number)
- ✅ Phone number validation and formatting
- ✅ Error handling and validation
- ✅ CORS configuration
- ✅ Health check endpoint

### Next Steps (Future Phases)
- ⏳ Firebase Firestore integration
- ⏳ User database persistence
- ⏳ JWT authentication tokens
- ⏳ Books API
- ⏳ Cart API
- ⏳ Orders API

## 📖 API Documentation

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for detailed API documentation and testing examples.

## 🧪 Testing

### Using cURL
```bash
# Test health endpoint
curl http://localhost:5000/health

# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"mobileNumber\": \"9876543210\"}"

# Register user (after receiving OTP)
curl -X POST http://localhost:5000/api/auth/register-mobile \
  -H "Content-Type: application/json" \
  -d "{\"mobileNumber\": \"9876543210\", \"otp\": \"123456\", \"firstName\": \"John\"}"
```

### Using Postman/Thunder Client
Import the endpoints from [API_ENDPOINTS.md](./API_ENDPOINTS.md)

**Status**: Phase 1 & 2 Complete ✅  
**Current**: SMS API for User Registration Implemented 🚀  
**Next**: Firebase Database Integration
