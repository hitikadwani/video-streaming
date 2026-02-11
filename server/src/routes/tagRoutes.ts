import express from 'express';
import * as videoController from '../controllers/videoController';
import { requireAuth } from '../middleware/authMiddleware';

const router = express.Router();

// Public route - no auth required (needed for search page filters)
router.get('/', videoController.getAllTags);

export default router;  