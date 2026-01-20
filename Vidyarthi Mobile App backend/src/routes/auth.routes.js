const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @route   GET /api/auth/test
 * @desc    Test auth endpoint
 * @access  Public
 */
router.get('/test', authController.testAuth);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to mobile number
 * @access  Public
 * @body    { mobileNumber: string }
 */
router.post('/send-otp', authController.sendOtp);

/**
 * @route   POST /api/auth/register-mobile
 * @desc    Register user with mobile number and OTP
 * @access  Public
 * @body    { mobileNumber: string, otp: string, firstName?: string, lastName?: string, schoolName?: string, classStandard?: string, email?: string }
 */
router.post('/register-mobile', authController.registerMobile);

/**
 * @route   POST /api/auth/login-mobile
 * @desc    Login with mobile number and OTP
 * @access  Public
 * @body    { mobileNumber: string, otp: string }
 */
router.post('/login-mobile', authController.loginMobile);

/**
 * @route   POST /api/auth/register
 * @desc    Register user with email and password
 * @access  Public
 * @body    { email: string, password: string, firstName?: string, lastName?: string, schoolName?: string, classStandard?: string }
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post('/login', authController.login);

module.exports = router;


