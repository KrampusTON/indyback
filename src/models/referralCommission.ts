import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralCommission extends Document {
  transactionId: mongoose.Types.ObjectId;
  referrerAddress: string;
  level: number;
  commissionPercentage: number;
  commissionIndy: number;
  createdAt: Date;
}

const ReferralCommissionSchema: Schema = new Schema({
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'ReferralTransaction',
    required: true,
  },
  referrerAddress: {
    type: String,
    required: true,
    match: /^erd1[0-9a-z]{58}$/,
  },
  level: { type: Number, required: true, min: 1, max: 5 },
  commissionPercentage: { type: Number, required: true },
  commissionIndy: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReferralCommission>(
  'ReferralCommission',
  ReferralCommissionSchema
);
