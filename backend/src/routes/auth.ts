import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

import { sendWelcomeEmail, sendOtpEmail, sendVerificationEmail } from '../services/email.service';
import { logAudit } from '../services/audit.service';

const router = Router();

// Generate JWT Token
const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET!, {
        expiresIn: (process.env.JWT_EXPIRE || '7d') as any, // Cast to any to avoid string | undefined mismatches with SignOptions
    });
};

// @route   POST /api/auth/register
// @desc    Register a new userdelete this status update page 
// @access  Public
router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, department, role } = req.body;

        // Validation
        if (!name || !email || !password || !department) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }

        // Create user as unverified
        const user = await User.create({
            name,
            email,
            password,
            department,
            role: role || 'user',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            isVerified: false,
        });

        // Generate verification OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        user.emailVerifyOtp = await bcrypt.hash(otp, salt);
        user.emailVerifyExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send verification OTP email
        let emailSent = false;
        try {
            await sendVerificationEmail(user.email, otp);
            emailSent = true;
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        // In non-production, log OTP for testing (email may not be configured)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n=============================`);
            console.log(`VERIFICATION OTP for ${user.email}: ${otp}`);
            console.log(`=============================\n`);
        }

        res.status(201).json({
            success: true,
            needsVerification: true,
            email: user.email,
            message: emailSent
                ? 'Account created. Please verify your email with the OTP sent.'
                : 'Account created. OTP email could not be sent — check server logs or contact admin.',
            // Return OTP in response only in non-production for easy testing
            ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            res.status(400).json({ message: 'Please provide email and password' });
            return;
        }

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Block unverified users
        if (!user.isVerified) {
            res.status(403).json({ message: 'Please verify your email before logging in.', needsVerification: true, email: user.email });
            return;
        }

        // Generate token
        const token = generateToken(user._id.toString());

        // Log login
        await logAudit({
            userId: user._id.toString(),
            action: 'LOGIN',
            details: `User ${user.name} logged in`,
            resourceId: user._id.toString(),
            resourceType: 'Auth'
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatar_url: user.avatar_url,
            },
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department,
                avatar_url: req.user.avatar_url,
            },
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});



// @route   POST /api/auth/forgot-password
// @desc    Forgot Password - Send OTP
// @access  Public
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Please provide an email' });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP and save to user
        const salt = await bcrypt.genSalt(10);
        user.resetPasswordOtp = await bcrypt.hash(otp, salt);
        user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await user.save();

        try {
            await sendOtpEmail(user.email, otp);
            res.status(200).json({ success: true, message: 'OTP sent to email' });
        } catch (error) {
            console.error('Send OTP Error:', error); // Log the actual error
            user.resetPasswordOtp = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset Password using OTP
// @access  Public
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            res.status(400).json({ message: 'Please provide email, OTP, and new password' });
            return;
        }

        const user = await User.findOne({
            email,
            resetPasswordExpire: { $gt: Date.now() },
        }).select('+resetPasswordOtp');

        if (!user) {
            res.status(400).json({ message: 'Invalid token or token has expired' });
            return;
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, user.resetPasswordOtp || '');

        if (!isMatch) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }

        // Set new password
        user.password = password;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP after registration
// @access  Public
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            res.status(400).json({ message: 'Please provide email and OTP' });
            return;
        }

        const user = await User.findOne({
            email,
            emailVerifyExpire: { $gt: Date.now() },
        }).select('+emailVerifyOtp +password');

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        const isMatch = await bcrypt.compare(otp, user.emailVerifyOtp || '');
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }

        user.isVerified = true;
        user.emailVerifyOtp = undefined;
        user.emailVerifyExpire = undefined;
        await user.save();

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
        } catch (e) {
            console.error('Failed to send welcome email:', e);
        }

        const token = generateToken(user._id.toString());

        await logAudit({
            userId: user._id.toString(),
            action: 'REGISTER',
            details: `User ${user.name} verified and registered`,
            resourceId: user._id.toString(),
            resourceType: 'User'
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatar_url: user.avatar_url,
            },
        });
    } catch (error: any) {
        console.error('Verify email error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification OTP
// @access  Public
router.post('/resend-verification', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ message: 'Please provide an email' });
            return;
        }

        const user = await User.findOne({ email });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ message: 'Email already verified' });
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        user.emailVerifyOtp = await bcrypt.hash(otp, salt);
        user.emailVerifyExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(user.email, otp);

        res.json({ success: true, message: 'Verification OTP resent' });
    } catch (error: any) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.put('/change-password', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Please provide current and new password' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ message: 'New password must be at least 6 characters' });
            return;
        }

        const user = await User.findById(req.user!._id).select('+password');

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password is incorrect' });
            return;
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
