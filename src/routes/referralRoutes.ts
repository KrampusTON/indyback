import { Router } from 'express';
import { ReferralController } from '../controllers/referralController';

const router = Router();
const controller = new ReferralController();

router.post('/register', controller.registerUser);
router.get('/stats/:address', controller.getReferralStats);
router.get('/tree/:address', controller.getReferralTree);

export default router;
