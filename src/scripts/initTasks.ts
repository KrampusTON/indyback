import mongoose from 'mongoose';
import Task from '../models/task';
import { connectDatabase } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

const tasks = [
  {
    taskId: 'referral_invite_3',
    title: 'Invite 3 Friends',
    description:
      'Invite 3 friends to join the INDY adventure using your referral link.',
    rewardIndy: 10000,
    type: 'referral',
    target: 3,
    category: 'Easy',
  },
  {
    taskId: 'social_twitter_post',
    title: 'Tweet About INDY',
    description: 'Write a tweet about INDY and share your referral link.',
    rewardIndy: 10000,
    type: 'social',
    target: 1,
    category: 'Medium',
  },
  {
    taskId: 'purchase_1000_indy',
    title: 'Purchase 1000 INDY',
    description: 'Buy at least 1000 INDY tokens to unlock this reward.',
    rewardIndy: 5000,
    type: 'purchase',
    target: 1000,
    category: 'Hard',
  },
];

async function initTasks() {
  await connectDatabase();
  await Task.deleteMany({});
  await Task.insertMany(tasks);
  console.log('Tasks initialized');
  mongoose.connection.close();
}

initTasks();
