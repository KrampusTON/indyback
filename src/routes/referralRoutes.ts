import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { ReferralController } from '../controllers/referralController';

const router = Router();
const controller = new ReferralController();

// Routy s asyncHandler pre spracovanie chýb
router.post('/register', asyncHandler(controller.registerUser.bind(controller)));
router.get('/stats/:address', asyncHandler(controller.getReferralStats.bind(controller)));
router.get('/tree/:address', asyncHandler(controller.getReferralTree.bind(controller)));

export default router;
