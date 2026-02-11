import express from 'express';
import * as videoController from '../controllers/videoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - no auth required
router.get('/', videoController.getAllVideos);
router.get('/search', videoController.searchVideos);

// Protected routes - auth required
router.get('/stream/:id', requireAuth, videoController.streamVideo);
router.get('/:id', requireAuth, videoController.getVideoById);

export default router;  