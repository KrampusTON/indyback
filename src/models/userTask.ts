import mongoose, { Schema, Document } from 'mongoose';

export interface IUserTask extends Document {
  userAddress: string;
  taskId: string;
  progress: number;
  status: 'available' | 'in-progress' | 'completed' | 'claimed';
  completedAt?: Date;
  claimedAt?: Date;
}

const UserTaskSchema: Schema = new Schema({
  userAddress: { type: String, required: true, match: /^erd1[0-9a-z]{58}$/ },
  taskId: { type: String, required: true },
  progress: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['available', 'in-progress', 'completed', 'claimed'],
    default: 'available',
  },
  completedAt: { type: Date },
  claimedAt: { type: Date },
});

export default mongoose.model<IUserTask>('UserTask', UserTaskSchema);
