import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  name: string;
  brand: string;
  logoUrl?: string;
  color: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  householdId: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const CardSchema = new Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    logoUrl: { type: String },
    color: { type: String, required: true },
    limit: { type: Number, required: true },
    closingDay: { type: Number, required: true },
    dueDay: { type: Number, required: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ICard>('Card', CardSchema);
