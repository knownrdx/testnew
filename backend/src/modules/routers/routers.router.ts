import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { attachTenant } from '../../middleware/tenant.middleware';
import * as ctrl from './routers.controller';

const router = Router();

router.use(authenticate, attachTenant);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/test', ctrl.testConnection);

export default router;
