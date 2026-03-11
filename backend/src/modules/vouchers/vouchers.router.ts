import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { attachTenant } from '../../middleware/tenant.middleware';
import * as ctrl from './vouchers.controller';

const router = Router();

router.use(authenticate, attachTenant);

router.get('/', ctrl.list);
router.post('/generate', ctrl.generate);
router.post('/export-pdf', ctrl.exportPdf);
router.delete('/:id', ctrl.deactivate);

export default router;
