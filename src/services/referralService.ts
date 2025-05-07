import mongoose from 'mongoose';

// Definícia schémy používateľa
const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  referrerAddress: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema, 'users');

export class ReferralService {
  // Validácia MultiversX adresy
  private validateAddress(address: string): boolean {
    return /^erd1[a-z0-9]{58}$/.test(address);
  }

  async registerUser(address: string, name: string, referrerAddress?: string): Promise<any> {
    if (!this.validateAddress(address)) {
      throw new Error('Invalid MultiversX address');
    }

    if (referrerAddress && !this.validateAddress(referrerAddress)) {
      throw new Error('Invalid referrer address');
    }

    try {
      // Skontroluj, či používateľ už existuje
      const existingUser = await User.findOne({ address });
      if (existingUser) {
        throw new Error('User already registered');
      }

      // Skontroluj, či referrer existuje
      if (referrerAddress) {
        const referrer = await User.findOne({ address: referrerAddress });
        if (!referrer) {
          throw new Error('Referrer not found');
        }
      }

      // Vytvor nového používateľa
      const user = new User({
        address,
        name,
        referrerAddress: referrerAddress || null,
      });
      await user.save();

      return { message: 'User registered successfully', user: { address, name } };
    } catch (error: any) {
      console.error('Error in registerUser:', error.message, error.stack);
      throw error;
    }
  }

  async getReferralStats(address: string): Promise<any> {
    if (!this.validateAddress(address)) {
      throw new Error('Invalid MultiversX address');
    }

    try {
      // Počet referralov
      const referralsCount = await User.countDocuments({ referrerAddress: address });

      // Simulované štatistiky (prispôsob podľa logiky projektu)
      const stats = {
        referrals: referralsCount,
        rewards: referralsCount * 100, // 100 INDY za referral
        nfts: Math.floor(referralsCount / 50), // 1 NFT za 50 referralov
        pendingRewards: referralsCount * 10, // 10 INDY čakajúcich
        nextGoal: 50 - (referralsCount % 50), // Nasledujúci cieľ
      };

      return stats;
    } catch (error: any) {
      console.error('Error in getReferralStats:', error.message, error.stack);
      throw error;
    }
  }

  async getReferralTree(address: string): Promise<any> {
    if (!this.validateAddress(address)) {
      throw new Error('Invalid MultiversX address');
    }

    try {
      const referralTree: { level: number; users: { name: string; address: string }[] }[] = [];

      // Rekurzívne získanie referralov
      const fetchReferrals = async (referrerAddress: string, level: number) => {
        const referrals = await User.find({ referrerAddress }).select('name address');
        if (referrals.length === 0) return;

        referralTree.push({
          level,
          users: referrals.map((user) => ({
            name: user.name,
            address: user.address,
          })),
        });

        for (const referral of referrals) {
          await fetchReferrals(referral.address, level + 1);
        }
      };

      await fetchReferrals(address, 1);

      return referralTree;
    } catch (error: any) {
      console.error('Error in getReferralTree:', error.message, error.stack);
      throw error;
    }
  }
}
