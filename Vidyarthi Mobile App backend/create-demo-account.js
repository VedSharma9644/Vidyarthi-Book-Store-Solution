/**
 * Script to create demo account for Google Play reviewers
 * Run with: node create-demo-account.js
 */

require('dotenv').config();
const userService = require('./src/services/userService');
const bcrypt = require('bcrypt');

async function createDemoAccount() {
    try {
        const demoEmail = 'demo@vidyakart.com';
        const demoPassword = '123456';

        // Check if demo account already exists
        const existingUser = await userService.getUserByEmail(demoEmail);
        
        if (existingUser) {
            console.log('✅ Demo account already exists!');
            console.log('Email:', demoEmail);
            console.log('Password:', demoPassword);
            console.log('User ID:', existingUser.id);
            return;
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(demoPassword, saltRounds);

        // Create demo user
        const user = await userService.createUser({
            email: demoEmail,
            password: hashedPassword,
            firstName: 'Demo',
            lastName: 'User',
            schoolName: 'Demo School',
            classStandard: 'Grade 10',
            roleName: 'Customer',
        });

        console.log('✅ Demo account created successfully!');
        console.log('Email:', demoEmail);
        console.log('Password:', demoPassword);
        console.log('User ID:', user.id);
        console.log('\n📝 Share these credentials with Google Play reviewers:');
        console.log('Email: demo@vidyakart.com');
        console.log('Password: 123456');
    } catch (error) {
        console.error('❌ Error creating demo account:', error.message);
        process.exit(1);
    }
}

createDemoAccount()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

