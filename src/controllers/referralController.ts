import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';

const referralService = new ReferralService();

export class ReferralController {
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { address, name, referrerAddress } = req.body;
      console.log(`Processing registerUser: address=${address}, name=${name}, referrerAddress=${referrerAddress}`);
      if (!address || !name) {
        res.status(400).json({ error: 'Address and name are required' });
        return;
      }
      const user = await referralService.registerUser(address, name, referrerAddress);
      console.log(`registerUser response:`, user);
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error in registerUser:', error.message, error.stack);
      if (error.message === 'User already registered') {
        res.status(409).json({ error: error.message });
      } else if (error.message === 'Invalid MultiversX address' || error.message === 'Referrer not found') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async getReferralStats(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      console.log(`Processing getReferralStats for address: ${address}`);
      const stats = await referralService.getReferralStats(address);
      console.log(`getReferralStats response:`, stats);
      res.status(200).json(stats);
    } catch (error: any) {
      console.error('Error in getReferralStats:', error.message, error.stack);
      if (error.message === 'Invalid MultiversX address') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  }

  async getReferralTree(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;
      console.log(`Processing getReferralTree for address: ${address}`);
      const tree = await referralService.getReferralTree(address);
      console.log(`getReferralTree response:`, tree);
      res.status(200).json(tree);
    } catch (error: any) {
      console.error('Error in getReferralTree:', error.message, error.stack);
      if (error.message === 'Invalid MultiversX address') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  }
}
