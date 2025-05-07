import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  title: string;
  description: string;
  rewardIndy: number;
  type: 'referral' | 'social' | 'purchase' | 'other';
  target: number;
  category: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
}

const TaskSchema: Schema = new Schema({
  taskId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  rewardIndy: { type: Number, required: true },
  type: {
    type: String,
    enum: ['referral', 'social', 'purchase', 'other'],
    required: true,
  },
  target: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Very Hard'],
    required: true,
  },
});

export default mongoose.model<ITask>('Task', TaskSchema);
