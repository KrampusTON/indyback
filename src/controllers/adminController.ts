import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';

const referralService = new ReferralService();

export class AdminController {
  async createTask(req: Request, res: Response) {
    try {
      const { taskId, title, description, rewardIndy, type, target, category } =
        req.body;
      const task = await referralService.createTask(
        taskId,
        title,
        description,
        rewardIndy,
        type,
        target,
        category
      );
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const updates = req.body;
      const task = await referralService.updateTask(taskId, updates);
      res.status(200).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      await referralService.deleteTask(taskId);
      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllTasks(req: Request, res: Response) {
    try {
      const tasks = await referralService.getAllTasks();
      res.status(200).json(tasks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
