import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  paidAt?: Date;
  categoryId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  owedBy?: mongoose.Types.ObjectId | null;
  owedAmount?: number;
  splitType: 'MINE' | 'HERS' | 'SHARED_50_50' | 'SHARED_CUSTOM';
  paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT' | 'CASH';
  cardId?: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurringExpenseId?: mongoose.Types.ObjectId;
  installmentGroupId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  deletedAt?: Date;
}

const TransactionSchema = new Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
    date: { type: Date, required: true },
    paidAt: { type: Date },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    owedAmount: { type: Number, default: 0 },
    splitType: { type: String, enum: ['MINE', 'HERS', 'SHARED_50_50', 'SHARED_CUSTOM'], required: true },
    paymentMethod: { type: String, enum: ['PIX', 'CREDIT_CARD', 'DEBIT', 'CASH'], required: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card' },
    isRecurring: { type: Boolean, default: false },
    recurringExpenseId: { type: Schema.Types.ObjectId, ref: 'RecurringExpense', default: null },
    installmentGroupId: { type: String },
    installmentNumber: { type: Number },
    totalInstallments: { type: Number },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
