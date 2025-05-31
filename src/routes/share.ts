import express, { Router } from 'express';
import { createShare, getShare, updateShare } from '../controllers/shareController';
import { shareRateLimit, retrieveRateLimit } from '../middleware/rateLimiter';

const router: Router = express.Router();

router.post('/share', shareRateLimit, createShare);
router.post('/share/:code', retrieveRateLimit, getShare); // POST for password support
router.get('/share/:code', retrieveRateLimit, getShare);
router.get('/retrieve/:code', retrieveRateLimit, getShare); // Alias for simplified frontend
router.put('/share/:code', updateShare);

export default router;
