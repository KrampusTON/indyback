import { Request, Response, NextFunction } from 'express';
import { ReferralService } from '../services/referralService';
import { User } from '@multiversx/sdk-wallet/out';
import { verifyMessage } from '@multiversx/sdk-wallet/out';

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
      return res.status(401).json({ error: 'Missing x-address or x-signature header' });
    }

    try {
      const message = req.url.includes('stats')
        ? `Stats request for ${address}`
        : `Tree request for ${address}`;
      const user = User.fromAddress(address);
      const isValid = verifyMessage({
        message,
        address: user.address,
        signature,
      });
      if (!isValid) {
        console.log(`Authentication failed: Invalid signature for ${address}`);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log(`Authentication successful for ${address}`);
      next();
    } catch (error: any) {
      console.error(`Signature verification error for ${address}: ${error.message}`);
      return res.status(401).json({ error: 'Signature verification failed', details: error.message });
    }
  };

  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { address, name, referrerAddress } = req.body;
      console.log(`Registering user: address=${address}, name=${name}, referrerAddress=${referrerAddress || 'none'}`);
      
      if (!address || !name) {
        console.log('Validation failed: Missing address or name');
        res.status(400).json({ error: 'Address and name are required' });
        return;
      }

      const user = await this.referralService.registerUser(address, name, referrerAddress);
      console.log(`User registered successfully:`, user);
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
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    }
  }

  async getReferralStats(req: Request, res: Response): Promise<void> {
    this.authenticate(req, res, async () => {
      try {
        const { address } = req.params;
        console.log(`Fetching referral stats for address: ${address}`);
        
        if (!address) {
          console.log('Validation failed: Missing address parameter');
          res.status(400).json({ error: 'Address parameter is required' });
          return;
        }

        const stats = await this.referralService.getReferralStats(address);
        console.log(`Referral stats retrieved:`, stats);
        res.status(200).json(stats);
      } catch (error: any) {
        console.error('Error in getReferralStats:', error.message, error.stack);
        if (error.message === 'Invalid MultiversX address') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error', details: error.message });
        }
      }
    });
  }

  async getReferralTree(req: Request, res: Response): Promise<void> {
    this.authenticate(req, res, async () => {
      try {
        const { address } = req.params;
        console.log(`Fetching referral tree for address: ${address}`);
        
        if (!address) {
          console.log('Validation failed: Missing address parameter');
          res.status(400).json({ error: 'Address parameter is required' });
          return;
        }

        const tree = await this.referralService.getReferralTree(address);
        console.log(`Referral tree retrieved:`, tree);
        res.status(200).json(tree);
      } catch (error: any) {
        console.error('Error in getReferralTree:', error.message, error.stack);
        if (error.message === 'Invalid MultiversX address') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error', details: error.message });
        }
      }
    });
  }
}
