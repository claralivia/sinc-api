import crypto from 'crypto';
import mongoose from 'mongoose';
import Transaction, { ITransaction } from '../models/Transaction';
import Card from '../models/Card';

export class TransactionService {
  
  private calculateDebt(
    amount: number, 
    paidBy: mongoose.Types.ObjectId, 
    splitType: ITransaction['splitType'], 
    partnerId?: mongoose.Types.ObjectId,
    customSplitPercentage?: number
  ) {
    if (splitType === 'MINE' || splitType === 'HERS' || !partnerId) {
      return { owedBy: null, owedAmount: 0 };
    }

    if (splitType === 'SHARED_50_50') {
      return { 
        owedBy: partnerId, 
        owedAmount: Math.floor(amount / 2) 
      };
    }

    if (splitType === 'SHARED_CUSTOM' && customSplitPercentage) {
      const owedAmount = Math.floor(amount * (customSplitPercentage / 100));
      return { 
        owedBy: partnerId, 
        owedAmount 
      };
    }

    return { owedBy: null, owedAmount: 0 };
  }

  async createTransaction(data: Partial<ITransaction> & { partnerId?: mongoose.Types.ObjectId, customSplitPercentage?: number }) {
    if (data.cardId) {
      const cardExists = await Card.findById(data.cardId);
      if (!cardExists) {
        throw new Error('Cartão não encontrado.');
      }
    }

    const { owedBy, owedAmount } = this.calculateDebt(
      data.amount!, 
      data.paidBy!, 
      data.splitType!, 
      data.partnerId, 
      data.customSplitPercentage
    );

    const baseData = { ...data, owedBy, owedAmount };

    const isInstallment = data.paymentMethod === 'CREDIT_CARD' && data.totalInstallments && data.totalInstallments > 1;

    if (isInstallment) {
      const totalInstallments = data.totalInstallments!;
      const totalAmount = data.amount!;
      
      const baseInstallmentAmount = Math.floor(totalAmount / totalInstallments);
      const remainder = totalAmount % totalInstallments;
      const groupId = crypto.randomUUID();
      const transactionsToInsert = [];

      for (let i = 1; i <= totalInstallments; i++) {
        const installmentDate = new Date(data.date as Date);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

        const amountForThisInstallment = i === 1 
          ? baseInstallmentAmount + remainder 
          : baseInstallmentAmount;

        const installmentDebt = this.calculateDebt(
          amountForThisInstallment, 
          baseData.paidBy!, 
          baseData.splitType!, 
          baseData.partnerId, 
          baseData.customSplitPercentage
        );

        transactionsToInsert.push({
          ...baseData,
          amount: amountForThisInstallment,
          owedAmount: installmentDebt.owedAmount,
          installmentGroupId: groupId,
          installmentNumber: i,
          date: installmentDate,
        });
      }

      return await Transaction.insertMany(transactionsToInsert);
    }

    return await Transaction.create(baseData);
  }

  async listTransactions(filters: any, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const query: any = { deletedAt: null };

    if (filters.startDate && filters.endDate) {
      query.date = { 
        $gte: new Date(filters.startDate), 
        $lte: new Date(filters.endDate) 
      };
    }

    if (filters.type) query.type = filters.type;
    if (filters.categoryId) query.categoryId = filters.categoryId;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name icon color')
        .populate('paidBy', 'name avatarUrl')
        .populate('owedBy', 'name avatarUrl')
        .populate('cardId', 'name color'),
      Transaction.countDocuments(query)
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async deleteTransaction(id: string) {
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) throw new Error('Transação não encontrada.');
    return transaction;
  }

  async getInstallmentSummary() {
    const now = new Date();

    const groups = await Transaction.aggregate([
      {
        $match: {
          installmentGroupId: { $ne: null },
          deletedAt: null,
        },
      },
      {
        $sort: { installmentNumber: 1 },
      },
      {
        $group: {
          _id: '$installmentGroupId',
          description: { $first: '$description' },
          categoryId: { $first: '$categoryId' },
          splitType: { $first: '$splitType' },
          totalAmount: { $sum: '$amount' },
          totalInstallments: { $first: '$totalInstallments' },
          paidCount: { $sum: { $cond: [{ $lte: ['$date', now] }, 1, 0] } },
          nextDueDate: {
            $min: { $cond: [{ $gt: ['$date', now] }, '$date', null] },
          },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $project: {
          _id: 0,
          installmentGroupId: '$_id',
          description: 1,
          splitType: 1,
          totalAmount: 1,
          totalInstallments: 1,
          paidCount: 1,
          pendingCount: { $subtract: ['$totalInstallments', '$paidCount'] },
          nextDueDate: 1,
          categoryName: { $arrayElemAt: ['$category.name', 0] },
          categoryIcon: { $arrayElemAt: ['$category.icon', 0] },
          categoryColor: { $arrayElemAt: ['$category.color', 0] },
        },
      },
      { $sort: { nextDueDate: 1 } },
    ]);

    return groups;
  }
}
