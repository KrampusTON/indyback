import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralTransaction extends Document {
  buyerAddress: string;
  amountIndy: number;
  egldSpent: number;
  transactionHash: string;
  createdAt: Date;
}

const ReferralTransactionSchema: Schema = new Schema({
  buyerAddress: { type: String, required: true, match: /^erd1[0-9a-z]{58}$/ },
  amountIndy: { type: Number, required: true },
  egldSpent: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReferralTransaction>(
  'ReferralTransaction',
  ReferralTransactionSchema
);
