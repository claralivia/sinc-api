import mongoose, { Schema, Document } from 'mongoose';

export interface IRecurringExpense extends Document {
  description: string;
  amount: number;
  categoryId: mongoose.Types.ObjectId;
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT' | 'CASH';
  cardId?: mongoose.Types.ObjectId;
  splitType: 'MINE' | 'HERS' | 'SHARED_50_50' | 'SHARED_CUSTOM';
  owedBy?: mongoose.Types.ObjectId;
  customSplitPercentage?: number;
  dueDay: number;
  active: boolean;
  householdId: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const RecurringExpenseSchema = new Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    paymentMethod: { type: String, enum: ['PIX', 'CREDIT_CARD', 'DEBIT', 'CASH'], required: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card' },
    splitType: { type: String, enum: ['MINE', 'HERS', 'SHARED_50_50', 'SHARED_CUSTOM'], required: true },
    owedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    customSplitPercentage: { type: Number },
    dueDay: { type: Number, required: true },
    active: { type: Boolean, default: true },
    householdId: { type: Schema.Types.ObjectId, ref: 'Household', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IRecurringExpense>('RecurringExpense', RecurringExpenseSchema);
