import express from 'express';
import * as authController from '../controllers/authController';
import { redirectIfAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', redirectIfAuthenticated, authController.register);
router.post('/login', redirectIfAuthenticated, authController.login);
router.post('/logout', authController.logout);

router.get('/me', authController.getCurrentUser);

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

export default router;  