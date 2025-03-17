import express from 'express';
import { register, resetPassword, sendResetOtp } from '../controllers/authController.js';
import { login } from '../controllers/authController.js';
import { logout } from '../controllers/authController.js';
import { sendVerifyOtp } from '../controllers/authController.js';
import { verifyEmail } from '../controllers/authController.js';
import { isAuthenticated } from '../controllers/authController.js';
import { verifyOtp } from '../controllers/authController.js';  // ✅ Ensure function exists

import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/send-verify-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail);
authRouter.get('/is-auth', userAuth, isAuthenticated);
authRouter.post('/send-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/verify-otp', verifyOtp);  // ✅ Add this route



export default authRouter;