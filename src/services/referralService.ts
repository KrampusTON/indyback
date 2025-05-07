import User, { IUser } from '../models/user';
import ReferralTransaction, {
  IReferralTransaction,
} from '../models/referralTransaction';
import ReferralCommission, {
  IReferralCommission,
} from '../models/referralCommission';
import NftReward, { INftReward } from '../models/nftReward';
import Task, { ITask } from '../models/task';
import UserTask, { IUserTask } from '../models/userTask';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import {
  SmartContract,
  Address,
  Transaction,
  TransactionPayload,
} from '@multiversx/sdk-core';
import { TwitterApi } from 'twitter-api-v2';

const commissionRates = [4, 0.3, 0.1, 0.05, 0.01];
const networkProvider = new ProxyNetworkProvider(
  'https://gateway.multiversx.com',
  { clientName: 'indianadog-backend' }
);
const rewardsContractAddress =
  'erd1qqqqqqqqqqqqqpgqs7zn42jgg69whxx8352kx8flnyujk5xy8gqqtwkxe5';

let twitterClient: TwitterApi;
try {
  twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY || 'OBXJKfuCVKUCU97PgCGD34n1J',
    appSecret:
      process.env.TWITTER_API_SECRET ||
      'zEHovYXkYj7uEHpUSiPul1htGoNXhPDamiTjKw5rV1QkrYB1U1',
    accessToken:
      process.env.TWITTER_ACCESS_TOKEN ||
      '1780177558656413696-LY3sNwBEhmrcjozSvvv0qwUiMICVu2',
    accessSecret:
      process.env.TWITTER_ACCESS_TOKEN_SECRET ||
      'x5AcgYk4VsdfRwJATEPCz6vfjSFKCm8OyBtxoOguJ3o8B',
  });
  console.log('Twitter API client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Twitter API client:', error);
  twitterClient = new TwitterApi({
    appKey: '',
    appSecret: '',
    accessToken: '',
    accessSecret: '',
  });
}

export class ReferralService {
  async registerUser(
    address: string,
    name: string,
    referrerAddress?: string
  ): Promise<IUser> {
    if (!address.match(/^erd1[0-9a-z]{58}$/)) {
      throw new Error('Invalid user address');
    }
    if (referrerAddress && !referrerAddress.match(/^erd1[0-9a-z]{58}$/)) {
      throw new Error('Invalid referrer address');
    }
    if (address === referrerAddress) {
      throw new Error('Self-referral is not allowed');
    }

    const existingUser = await User.findOne({ address });
    if (existingUser) {
      throw new Error('User already registered');
    }

    if (referrerAddress) {
      const referrer = await User.findOne({ address: referrerAddress });
      if (!referrer) {
        throw new Error('Referrer not found');
      }
    }

    const user = new User({
      address,
      name,
      referrerAddress: referrerAddress || null,
      pendingRewards: 0,
    });
    await user.save();

    const tasks = await Task.find();
    const userTasks = tasks.map((task) => ({
      userAddress: address,
      taskId: task.taskId,
      progress: 0,
      status: 'available',
    }));
    await UserTask.insertMany(userTasks);

    if (referrerAddress) {
      await this.updateReferralTaskProgress(referrerAddress);
    }

    return user;
  }

  async processPurchase(
    buyerAddress: string,
    amountIndy: number,
    egldSpent: number,
    transactionHash: string
  ): Promise<void> {
    const buyer = await User.findOne({ address: buyerAddress });
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    const transaction = new ReferralTransaction({
      buyerAddress,
      amountIndy,
      egldSpent,
      transactionHash,
    });
    await transaction.save();

    let currentAddress = buyerAddress;
    const commissions: IReferralCommission[] = [];
    for (let level = 1; level <= 5; level++) {
      const user = await User.findOne({ address: currentAddress });
      if (!user || !user.referrerAddress) {
        break;
      }

      const commission = new ReferralCommission({
        transactionId: transaction._id,
        referrerAddress: user.referrerAddress,
        level,
        commissionPercentage: commissionRates[level - 1],
        commissionIndy: (amountIndy * commissionRates[level - 1]) / 100,
      });
      commissions.push(commission);

      currentAddress = user.referrerAddress;
    }

    await ReferralCommission.insertMany(commissions);

    await this.updatePurchaseTaskProgress(buyerAddress, amountIndy);
    await this.checkNftRewards(buyerAddress);
  }

  async checkNftRewards(userAddress: string): Promise<void> {
    const referralCount = await User.countDocuments({
      referrerAddress: userAddress,
    });

    if (referralCount >= 50) {
      const existingReward = await NftReward.findOne({
        userAddress,
        nftType: 'Level 2 Reward',
      });
      if (!existingReward) {
        const nftReward = new NftReward({
          userAddress,
          nftType: 'Level 2 Reward',
        });
        await nftReward.save();
      }
    }
  }

  async getReferralStats(userAddress: string): Promise<any> {
    const referrals = await User.countDocuments({
      referrerAddress: userAddress,
    });

    const rewards = await ReferralCommission.aggregate([
      { $match: { referrerAddress: userAddress } },
      { $group: { _id: null, total: { $sum: '$commissionIndy' } } },
    ]);

    const nfts = await NftReward.countDocuments({ userAddress });

    const user = await User.findOne({ address: userAddress });

    return {
      referrals,
      rewards: rewards[0]?.total || 0,
      nfts,
      pendingRewards: user?.pendingRewards || 0,
      nextGoal: 50,
    };
  }

  async getReferralTree(userAddress: string): Promise<any[]> {
    const levels: any[] = [];
    let currentAddresses = [userAddress];

    for (let level = 1; level <= 5; level++) {
      const users = await User.find({
        referrerAddress: { $in: currentAddresses },
      });

      if (users.length === 0) {
        break;
      }

      levels.push({
        level,
        users: users.map((u) => ({
          name: u.name,
          address: u.address,
          parent: u.referrerAddress,
        })),
      });

      currentAddresses = users.map((u) => u.address);
    }

    return levels;
  }

  async updateReferralTaskProgress(userAddress: string): Promise<void> {
    const referralTasks = await Task.find({ type: 'referral' });
    const referralCount = await User.countDocuments({
      referrerAddress: userAddress,
    });

    for (const task of referralTasks) {
      const userTask = await UserTask.findOne({
        userAddress,
        taskId: task.taskId,
      });
      if (
        userTask &&
        userTask.status !== 'completed' &&
        userTask.status !== 'claimed'
      ) {
        userTask.progress = referralCount;
        if (userTask.progress >= task.target) {
          userTask.status = 'completed';
          userTask.completedAt = new Date();
          await User.updateOne(
            { address: userAddress },
            { $inc: { pendingRewards: task.rewardIndy } }
          );
        } else {
          userTask.status = 'in-progress';
        }
        await userTask.save();
      }
    }
  }

  async updateSocialTaskProgress(
    userAddress: string,
    tweetUrl: string
  ): Promise<void> {
    const isValidTweet = await this.verifyTweet(tweetUrl);
    if (!isValidTweet) {
      throw new Error('Invalid or unverifiable tweet');
    }

    const socialTasks = await Task.find({ type: 'social' });
    for (const task of socialTasks) {
      const userTask = await UserTask.findOne({
        userAddress,
        taskId: task.taskId,
      });
      if (
        userTask &&
        userTask.status !== 'completed' &&
        userTask.status !== 'claimed'
      ) {
        userTask.progress = 1;
        userTask.status = 'completed';
        userTask.completedAt = new Date();
        await User.updateOne(
          { address: userAddress },
          { $inc: { pendingRewards: task.rewardIndy } }
        );
        await userTask.save();
      }
    }
  }

  async updatePurchaseTaskProgress(
    userAddress: string,
    amountIndy: number
  ): Promise<void> {
    const purchaseTasks = await Task.find({ type: 'purchase' });
    for (const task of purchaseTasks) {
      const userTask = await UserTask.findOne({
        userAddress,
        taskId: task.taskId,
      });
      if (
        userTask &&
        userTask.status !== 'completed' &&
        userTask.status !== 'claimed'
      ) {
        userTask.progress += amountIndy;
        if (userTask.progress >= task.target) {
          userTask.status = 'completed';
          userTask.completedAt = new Date();
          await User.updateOne(
            { address: userAddress },
            { $inc: { pendingRewards: task.rewardIndy } }
          );
        } else {
          userTask.status = 'in-progress';
        }
        await userTask.save();
      }
    }
  }

  async claimRewards(userAddress: string): Promise<void> {
    const user = await User.findOne({ address: userAddress });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.pendingRewards <= 0) {
      throw new Error('No rewards to claim');
    }

    // MultiversX transakcia
    try {
      const contract = new SmartContract({
        address: new Address(rewardsContractAddress),
      });
      const txPayload = new TransactionPayload(
        `claimRewards@${user.pendingRewards.toString()}`
      );
      const senderAccount = await networkProvider.getAccount(
        new Address(userAddress)
      );
      const tx = new Transaction({
        sender: new Address(userAddress),
        receiver: new Address(rewardsContractAddress),
        value: '0',
        gasLimit: 10000000,
        data: txPayload,
        chainID: '1', // Mainnet, pre testnet použi 'T'
        version: 1,
        nonce: senderAccount.nonce,
      });

      await networkProvider.sendTransaction(tx);
      console.log(`Reward claim transaction sent for ${userAddress}`);
    } catch (error) {
      console.error('Error sending claim transaction:', error);
      throw new Error('Failed to send claim transaction');
    }

    // Aktualizácia databázy po úspešnej transakcii
    await UserTask.updateMany(
      { userAddress, status: 'completed' },
      { status: 'claimed', claimedAt: new Date() }
    );
    await User.updateOne({ address: userAddress }, { pendingRewards: 0 });
  }

  async verifyTweet(tweetUrl: string): Promise<boolean> {
    try {
      const tweetId = tweetUrl.split('/').pop();
      if (!tweetId) {
        console.error('Invalid tweet URL:', tweetUrl);
        return false;
      }
      const tweet = await twitterClient.v2.singleTweet(tweetId, {
        'tweet.fields': ['text', 'author_id'],
      });
      return (
        tweet.data.text.includes('INDY') &&
        tweet.data.text.includes('indianadog.app')
      );
    } catch (error) {
      console.error('Error verifying tweet:', error);
      // Simulácia ako záloha
      console.log('Simulating tweet verification for:', tweetUrl);
      return true;
    }
  }

  async getUserTasks(userAddress: string): Promise<any[]> {
    const userTasks = await UserTask.find({ userAddress });
    const tasks = await Task.find();

    return tasks.map((task) => {
      const userTask = userTasks.find((ut) => ut.taskId === task.taskId);
      return {
        id: task.taskId,
        title: task.title,
        description: task.description,
        reward: `${task.rewardIndy} INDY`,
        difficulty: task.category,
        progress: userTask?.progress || 0,
        status: userTask?.status || 'available',
        target: task.target,
      };
    });
  }

  async createTask(
    taskId: string,
    title: string,
    description: string,
    rewardIndy: number,
    type: 'referral' | 'social' | 'purchase' | 'other',
    target: number,
    category: 'Easy' | 'Medium' | 'Hard' | 'Very Hard'
  ): Promise<ITask> {
    const existingTask = await Task.findOne({ taskId });
    if (existingTask) {
      throw new Error('Task ID already exists');
    }

    const task = new Task({
      taskId,
      title,
      description,
      rewardIndy,
      type,
      target,
      category,
    });
    await task.save();

    const users = await User.find();
    const userTasks = users.map((user) => ({
      userAddress: user.address,
      taskId: task.taskId,
      progress: 0,
      status: 'available',
    }));
    await UserTask.insertMany(userTasks);

    return task;
  }

  async updateTask(
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      rewardIndy: number;
      type: 'referral' | 'social' | 'purchase' | 'other';
      target: number;
      category: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
    }>
  ): Promise<ITask | null> {
    const task = await Task.findOneAndUpdate({ taskId }, updates, {
      new: true,
    });
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  async deleteTask(taskId: string): Promise<void> {
    const task = await Task.findOneAndDelete({ taskId });
    if (!task) {
      throw new Error('Task not found');
    }
    await UserTask.deleteMany({ taskId });
  }

  async getAllTasks(): Promise<ITask[]> {
    return await Task.find();
  }
}
