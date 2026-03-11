import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { attachTenant } from '../../middleware/tenant.middleware';
import * as ctrl from './sessions.controller';

const router = Router();

router.use(authenticate, attachTenant);

router.get('/', ctrl.list);
router.get('/stats', ctrl.stats);
router.get('/export', ctrl.exportCsv);

export default router;
