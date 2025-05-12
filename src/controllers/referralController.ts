import { Request, Response, NextFunction } from 'express';
import { ReferralService } from '../services/referralService';
import { Address, UserVerifier } from '@multiversx/sdk-wallet';

export class ReferralController {
  private referralService: ReferralService;

  constructor() {
    this.referralService = new ReferralService();
  }

  private authenticate = (req: Request, res: Response, next: NextFunction) => {
    const address = req.headers['x-address'] as string;
    const signature = req.headers['x-signature'] as string;

    if (!address || !signature) {
      console.log(`Authentication failed: Missing headers for ${req.url}`);
      return res.status(401).json({ error: 'Missing authentication headers' });
    }

    try {
      const message = req.url.includes('stats')
        ? `Stats request for ${address}`
        : `Tree request for ${address}`;
      const userAddress = new Address(address);
      const verifier = UserVerifier.fromAddress(userAddress);

      // Overenie podpisu
      const isValid = verifier.verify(Buffer.from(message), Buffer.from(signature, 'hex'));

      if (!isValid) {
        console.log(`Authentication failed: Invalid signature for ${address}`);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log(`Authentication successful for ${address}`);
      next();
    } catch (error: any) {
      console.error(`Signature verification error: ${error.message}`);
      return res.status(401).json({ error: 'Signature verification failed' });
    }
  };

  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { address, name, referrerAddress } = req.body;
      console.log(`Processing registerUser: address=${address}, name=${name}, referrerAddress=${referrerAddress}`);
      if (!address || !name) {
        res.status(400).json({ error: 'Address and name are required' });
        return;
      }
      const user = await this.referralService.registerUser(address, name, referrerAddress);
      console.log(`registerUser response:`, user);
      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error in registerUser:', error.message, error.stack);
      if (error.message === 'User already registered') {
        res.status(409).json({ error: error.message });
      } else if (
        error.message === 'Invalid user address' ||
        error.message === 'Invalid referrer address' ||
        error.message === 'Referrer not found' ||
        error.message === 'Self-referral is not allowed'
      ) {
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
      const stats = await this.referralService.getReferralStats(address);
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
      const tree = await this.referralService.getReferralTree(address);
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
