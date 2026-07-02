import mongoose from 'mongoose';
import RecurringExpense from '../models/RecurringExpense';
import Transaction from '../models/Transaction';
import { TransactionService } from './TransactionService';

const transactionService = new TransactionService();

export class RecurringExpenseService {
  async listRecurringExpenses() {
    return await RecurringExpense.find({ deletedAt: null, active: true })
      .sort({ dueDay: 1 })
      .populate('categoryId', 'name icon color')
      .populate('cardId', 'name color logoUrl')
      .populate('owedBy', 'name');
  }

  async createRecurringExpense(data: Partial<{
    description: string;
    amount: number;
    categoryId: string;
    paymentMethod: string;
    cardId?: string;
    splitType: string;
    owedBy?: string;
    customSplitPercentage?: number;
    dueDay: number;
  }>) {
    return await RecurringExpense.create(data as any);
  }

  async updateRecurringExpense(id: string, data: Record<string, unknown>) {
    const recurringExpense = await RecurringExpense.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!recurringExpense) {
      throw new Error('Gasto fixo não encontrado.');
    }

    return recurringExpense;
  }

  async deleteRecurringExpense(id: string) {
    const recurringExpense = await RecurringExpense.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { returnDocument: 'after' }
    );

    if (!recurringExpense) {
      throw new Error('Gasto fixo não encontrado.');
    }

    return recurringExpense;
  }

  async listWithStatus(startDate: string, endDate: string) {
    const recurringExpenses = await this.listRecurringExpenses();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const paidTransactions = await Transaction.find({
      recurringExpenseId: { $in: recurringExpenses.map((expense) => expense._id) },
      date: { $gte: start, $lte: end },
      deletedAt: null,
    });

    return recurringExpenses.map((expense) => {
      const transaction = paidTransactions.find((item) => String(item.recurringExpenseId) === String(expense._id));

      return {
        ...expense.toObject(),
        paid: Boolean(transaction),
        transactionId: transaction?._id || null,
      };
    });
  }

  async launch(id: string, paidBy: string, date: Date) {
    const recurringExpense = await RecurringExpense.findOne({ _id: id, deletedAt: null });

    if (!recurringExpense) {
      throw new Error('Gasto fixo não encontrado.');
    }

    const transaction = await transactionService.createTransaction({
      description: recurringExpense.description,
      amount: recurringExpense.amount,
      type: 'EXPENSE',
      date,
      categoryId: recurringExpense.categoryId,
      paidBy: new mongoose.Types.ObjectId(paidBy),
      splitType: recurringExpense.splitType,
      paymentMethod: recurringExpense.paymentMethod,
      cardId: recurringExpense.cardId,
      isRecurring: true,
      recurringExpenseId: recurringExpense._id,
      partnerId: recurringExpense.owedBy,
      customSplitPercentage: recurringExpense.customSplitPercentage,
    } as any);

    return transaction;
  }
}
