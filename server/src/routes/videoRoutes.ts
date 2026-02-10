import express from 'express';
import * as videoController from '../controllers/videoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', requireAuth, videoController.getAllVideos);
router.get('/search', requireAuth, videoController.searchVideos);
router.get(':id', requireAuth, videoController.getVideoById);

router.get('/stream/:id', videoController.streamVideo);

export default router;  