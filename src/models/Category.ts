import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  householdId: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
