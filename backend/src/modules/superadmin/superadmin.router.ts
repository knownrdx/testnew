import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middleware/auth.middleware';
import * as ctrl from './superadmin.controller';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/stats', ctrl.getStats);
router.get('/hotels', ctrl.listHotels);
router.post('/admins', ctrl.createAdmin);
router.get('/hotels/:hotelId/admins', ctrl.listAdmins);
router.delete('/admins/:id', ctrl.deleteAdmin);
router.get('/audit-logs', ctrl.getAuditLogs);

export default router;
