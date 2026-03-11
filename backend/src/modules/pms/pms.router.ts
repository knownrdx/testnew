import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { handleWebhook, listEvents } from './pms.controller';

const router = Router();

// Public webhook endpoint (auth via HMAC)
router.post('/webhook/pms/:hotelSlug', handleWebhook);

// Protected event log
router.get('/events', authenticate, listEvents);

export default router;
