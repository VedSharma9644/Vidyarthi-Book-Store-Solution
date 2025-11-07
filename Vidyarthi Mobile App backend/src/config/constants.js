module.exports = {
    OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    OTP_RATE_LIMIT_WINDOW_MS: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    OTP_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.OTP_RATE_LIMIT_MAX_REQUESTS) || 3,
};


