import express from 'express';
import { auth_controller } from './controller.js';

const auth_router = express.Router();

// Email/Password Auth
auth_router.post('/signup', auth_controller.sign_up);
auth_router.post('/verify-otp', auth_controller.verify_otp);
auth_router.post('/login', auth_controller.sign_in);
auth_router.post('/forgot-password', auth_controller.forgot_password);
auth_router.post('/reset-password', auth_controller.reset_password);

// Google Auth
auth_router.get('/google', auth_controller.get_google_auth_url);
auth_router.get('/google/callback', auth_controller.verify_google_auth);

export default auth_router;
