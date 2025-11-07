const smsService = require('../services/smsService');
const otpStorage = require('../services/otpStorage');
const userService = require('../services/userService');

/**
 * Send OTP to mobile number
 */
const sendOtp = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        // Validation
        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number is required',
            });
        }

        // Validate 10-digit format
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobileNumber.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 10 digits.',
            });
        }

        // Format phone number
        const formattedNumber = smsService.formatPhoneNumber(mobileNumber);

        // Check rate limit
        if (!otpStorage.checkRateLimit(formattedNumber)) {
            return res.status(429).json({
                success: false,
                message: 'Too many OTP requests. Please try again later.',
            });
        }

        // Send OTP
        const result = await smsService.sendOtp(mobileNumber);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || 'Failed to send OTP. Please try again.',
            });
        }

        // Save OTP to Firestore
        const saved = await otpStorage.saveOtp(formattedNumber, result.otp);
        if (!saved) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.',
            });
        }

        // Return success (don't send OTP in response for security)
        res.json({
            success: true,
            message: 'OTP sent successfully to your mobile number',
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send OTP',
        });
    }
};

/**
 * Register user with mobile number and OTP
 */
const registerMobile = async (req, res) => {
    try {
        const { mobileNumber, otp, firstName, lastName, schoolName, classStandard, email } = req.body;

        // Validation
        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and OTP are required',
            });
        }

        // Validate mobile number format
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobileNumber.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 10 digits.',
            });
        }

        // Validate OTP format (6 digits)
        const otpRegex = /^[0-9]{6}$/;
        if (!otpRegex.test(otp.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format. Must be 6 digits.',
            });
        }

        // Format phone number
        const formattedNumber = smsService.formatPhoneNumber(mobileNumber);

        // Verify OTP from Firestore
        const isValidOtp = await otpStorage.verifyOtp(formattedNumber, otp.trim());
        
        if (!isValidOtp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.',
            });
        }

        // Check if user already exists
        const existingUser = await userService.getUserByPhoneNumber(formattedNumber);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already registered with this phone number. Please login instead.',
            });
        }

        // Create user in Firestore
        const user = await userService.createUser({
            mobileNumber: formattedNumber,
            firstName: firstName || null,
            lastName: lastName || null,
            email: email || null,
            schoolName: schoolName || null,
            classStandard: classStandard || null,
            roleName: 'Customer',
        });

        // TODO: Generate JWT token (next phase)
        const token = 'temp_token_will_be_replaced_with_jwt';

        res.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
                schoolName: user.schoolName,
                classStandard: user.classStandard,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error('Register Mobile Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Registration failed',
        });
    }
};

/**
 * Login with mobile number and OTP
 */
const loginMobile = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        // Validation
        if (!mobileNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number and OTP are required',
            });
        }

        // Validate formats
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(mobileNumber.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number format. Must be 10 digits.',
            });
        }

        const otpRegex = /^[0-9]{6}$/;
        if (!otpRegex.test(otp.trim())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format. Must be 6 digits.',
            });
        }

        // Format phone number
        const formattedNumber = smsService.formatPhoneNumber(mobileNumber);

        // Verify OTP from Firestore
        const isValidOtp = await otpStorage.verifyOtp(formattedNumber, otp.trim());
        
        if (!isValidOtp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.',
            });
        }

        // Fetch user from Firestore
        const user = await userService.getUserByPhoneNumber(formattedNumber);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register first.',
            });
        }

        // TODO: Generate JWT token (next phase)
        const token = 'temp_token_will_be_replaced_with_jwt';

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
                firstName: user.firstName,
                lastName: user.lastName,
                schoolName: user.schoolName,
                classStandard: user.classStandard,
                email: user.email,
            },
            token,
        });
    } catch (error) {
        console.error('Login Mobile Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Login failed',
        });
    }
};

/**
 * Test endpoint
 */
const testAuth = async (req, res) => {
    res.json({
        success: true,
        message: 'Auth API is working!',
        timestamp: new Date().toISOString(),
    });
};

module.exports = {
    sendOtp,
    registerMobile,
    loginMobile,
    testAuth,
};

