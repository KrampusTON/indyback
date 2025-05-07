import mongoose, { Schema, Document } from 'mongoose';

export interface INftReward extends Document {
  userAddress: string;
  nftType: string;
  awardedAt: Date;
}

const NftRewardSchema: Schema = new Schema({
  userAddress: { type: String, required: true, match: /^erd1[0-9a-z]{58}$/ },
  nftType: { type: String, required: true },
  awardedAt: { type: Date, default: Date.now },
});

export default mongoose.model<INftReward>('NftReward', NftRewardSchema);
