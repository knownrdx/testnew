import { Router } from 'express';
import { auth } from './hotspot.controller';

const router = Router();

// Public endpoint — called by captive portal app
router.post('/auth', auth);

export default router;
