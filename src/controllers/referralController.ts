import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';

const referralService = new ReferralService();

export class ReferralController {
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { address, name, referrerAddress } = req.body;
      if (!address || !name) {
        res.status(400).json({ error: 'Address and name are required' });
        return;
      }
      const user = await referralService.registerUser(address, name, referrerAddress);
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error in registerUser:', error.message, error.stack);
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const stats = await referralService.getReferralStats(address);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error in getReferralStats:', error.message, error.stack);
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralTree(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      const tree = await referralService.getReferralTree(address);
      res.status(200).json(tree);
    } catch (error: any) {
      console.error('Error in getReferralTree:', error.message, error.stack);
      res.status(400).json({ error: error.message });
    }
  }
}
