import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';
import { BlockchainService } from '../services/blockchainService';

const referralService = new ReferralService();
const blockchainService = new BlockchainService();

export class SaleController {
  async processPurchase(req: Request, res: Response) {
    try {
      const { userAddress, amount, egldSpent, transactionHash } = req.body;
      await referralService.processPurchase(
        userAddress,
        amount,
        egldSpent,
        transactionHash
      );
      res.status(200).json({ message: 'Purchase processed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSaleData(req: Request, res: Response) {
    try {
      const [tokenPrice, tokensAvailable, totalBought] = await Promise.all([
        blockchainService.getTokenPrice(),
        blockchainService.getTokensAvailable(),
        blockchainService.getTotalBought(),
      ]);
      res.status(200).json({ tokenPrice, tokensAvailable, totalBought });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
