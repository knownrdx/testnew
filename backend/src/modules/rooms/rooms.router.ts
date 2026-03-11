import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { attachTenant } from '../../middleware/tenant.middleware';
import * as ctrl from './rooms.controller';

const router = Router();

router.use(authenticate, attachTenant);

router.get('/', ctrl.list);
router.get('/profiles', ctrl.listProfiles);
router.post('/profiles', ctrl.createProfile);
router.post('/bulk', ctrl.bulkCreate);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
