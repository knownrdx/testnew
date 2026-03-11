import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../../middleware/auth.middleware';
import * as ctrl from './hotels.controller';

const router = Router();

// Public portal config endpoint
router.get('/portal/config/:slug', ctrl.getPortalConfig);

// Protected routes
router.use(authenticate);

router.get('/', requireSuperAdmin, ctrl.list);
router.post('/', requireSuperAdmin, ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', requireSuperAdmin, ctrl.remove);
router.post('/:id/rotate-secret', ctrl.rotateSecret);
router.put('/:id/portal', ctrl.updatePortalConfig);

export default router;
