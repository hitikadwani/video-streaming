import express from 'express';
import * as videoController from '../controllers/videoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', requireAuth, videoController.getAllTags);

export default router;  