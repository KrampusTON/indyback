import { Router } from 'express';
import { TaskController } from '../controllers/taskController';

const router = Router();
const controller = new TaskController();

router.get('/user/:address', controller.getUserTasks);
router.post('/social', controller.submitSocialTask);
router.post('/claim', controller.claimRewards);

export default router;
