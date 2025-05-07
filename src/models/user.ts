import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  address: string;
  name: string;
  referrerAddress?: string;
  pendingRewards: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    match: /^erd1[0-9a-z]{58}$/,
  },
  name: { type: String, required: true },
  referrerAddress: { type: String, match: /^erd1[0-9a-z]{58}$/, default: null },
  pendingRewards: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
