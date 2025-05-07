import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';

const referralService = new ReferralService();

export class ReferralController {
  async registerUser(req: Request, res: Response) {
    try {
      const { address, name, referrerAddress } = req.body;
      const user = await referralService.registerUser(
        address,
        name,
        referrerAddress
      );
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralStats(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const stats = await referralService.getReferralStats(address);
      res.status(200).json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReferralTree(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const tree = await referralService.getReferralTree(address);
      res.status(200).json(tree);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
