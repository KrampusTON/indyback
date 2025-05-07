import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { adminAuthMiddleware } from '../middleware/adminAuth';

const router = Router();
const controller = new AdminController();

router.post('/tasks', adminAuthMiddleware, controller.createTask);
router.put('/tasks/:taskId', adminAuthMiddleware, controller.updateTask);
router.delete('/tasks/:taskId', adminAuthMiddleware, controller.deleteTask);
router.get('/tasks', adminAuthMiddleware, controller.getAllTasks);

export default router;
