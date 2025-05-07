import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';

const referralService = new ReferralService();

export class TaskController {
  async getUserTasks(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const tasks = await referralService.getUserTasks(address);
      res.status(200).json(tasks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async submitSocialTask(req: Request, res: Response) {
    try {
      const { userAddress, tweetUrl } = req.body;
      await referralService.updateSocialTaskProgress(userAddress, tweetUrl);
      res.status(200).json({ message: 'Social task submitted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async claimRewards(req: Request, res: Response) {
    try {
      const { userAddress } = req.body;
      await referralService.claimRewards(userAddress);
      res.status(200).json({ message: 'Rewards claimed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
