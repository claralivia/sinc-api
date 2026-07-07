import crypto from 'crypto';
import mongoose from 'mongoose';
import Transaction, { ITransaction } from '../models/Transaction';
import Card from '../models/Card';
import { assertValidPartner, getOrCreateHouseholdId } from './UserService';

export class TransactionService {
  
  private calculateDebt(
    amount: number, 
    paidBy: mongoose.Types.ObjectId, 
    splitType: ITransaction['splitType'], 
    partnerId?: mongoose.Types.ObjectId,
    customSplitPercentage?: number
  ) {
    if (splitType === 'MINE' || !partnerId) {
      return { owedBy: null, owedAmount: 0 };
    }

    if (splitType === 'HERS') {
      return {
        owedBy: partnerId,
        owedAmount: amount
      };
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

  /**
   * Compras no crédito feitas depois do fechamento da fatura só serão pagas
   * (e devem contar no dashboard) no mês seguinte — por isso `competenceDate`
   * diverge de `date` só nesse caso.
   */
  private computeCompetenceDate(date: Date, paymentMethod: string, closingDay?: number): Date {
    if (paymentMethod !== 'CREDIT_CARD' || !closingDay) {
      return date;
    }

    const competenceDate = new Date(date);
    if (competenceDate.getDate() > closingDay) {
      competenceDate.setMonth(competenceDate.getMonth() + 1);
    }

    return competenceDate;
  }

  async createTransaction(data: Partial<ITransaction> & { partnerId?: mongoose.Types.ObjectId, customSplitPercentage?: number }) {
    let card = null;

    if (data.cardId) {
      card = await Card.findById(data.cardId);
      if (!card) {
        throw new Error('Cartão não encontrado.');
      }
    }

    const needsPartner = data.splitType === 'HERS' || data.splitType === 'SHARED_50_50' || data.splitType === 'SHARED_CUSTOM';

    if (needsPartner && data.partnerId) {
      await assertValidPartner(data.paidBy!.toString(), data.partnerId.toString());
    }

    const { owedBy, owedAmount } = this.calculateDebt(
      data.amount!,
      data.paidBy!,
      data.splitType!,
      data.partnerId,
      data.customSplitPercentage
    );

    const householdId = await getOrCreateHouseholdId(data.paidBy!.toString());

    const competenceDate = this.computeCompetenceDate(data.date as Date, data.paymentMethod!, card?.closingDay);

    const baseData = { ...data, owedBy, owedAmount, householdId, competenceDate };

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
          competenceDate: this.computeCompetenceDate(installmentDate, baseData.paymentMethod!, card?.closingDay),
        });
      }

      return await Transaction.insertMany(transactionsToInsert);
    }

    return await Transaction.create(baseData);
  }

  async updateTransaction(
    id: string,
    householdId: string,
    data: Partial<ITransaction> & { partnerId?: mongoose.Types.ObjectId | null; customSplitPercentage?: number }
  ) {
    const transaction = await Transaction.findOne({ _id: id, householdId, deletedAt: null });

    if (!transaction) {
      throw new Error('Transação não encontrada.');
    }

    const date = data.date ?? transaction.date;
    const paymentMethod = data.paymentMethod ?? transaction.paymentMethod;
    const cardId = data.cardId !== undefined ? data.cardId : transaction.cardId;

    let card = null;

    if (data.cardId) {
      card = await Card.findById(data.cardId);
      if (!card) {
        throw new Error('Cartão não encontrado.');
      }
    } else if (cardId && paymentMethod === 'CREDIT_CARD') {
      card = await Card.findById(cardId);
    }

    const competenceDate = this.computeCompetenceDate(date as Date, paymentMethod, card?.closingDay);

    const amount = data.amount ?? transaction.amount;
    const splitType = data.splitType ?? transaction.splitType;
    const customSplitPercentage = data.customSplitPercentage ?? transaction.customSplitPercentage;

    // Só recalcula a divisão se algum campo que a afeta veio na requisição —
    // caso contrário mantém owedBy/owedAmount como estavam (edições que só
    // mudam descrição/categoria/etc não devem "resetar" a divisão existente).
    const splitInputsChanged =
      data.amount !== undefined ||
      data.splitType !== undefined ||
      data.partnerId !== undefined ||
      data.customSplitPercentage !== undefined;

    let owedBy = transaction.owedBy;
    let owedAmount = transaction.owedAmount;

    if (splitInputsChanged) {
      const partnerId = data.partnerId !== undefined ? data.partnerId ?? undefined : transaction.owedBy ?? undefined;
      const needsPartner = splitType === 'HERS' || splitType === 'SHARED_50_50' || splitType === 'SHARED_CUSTOM';

      if (needsPartner && partnerId) {
        await assertValidPartner(transaction.paidBy.toString(), partnerId.toString());
      }

      const debt = this.calculateDebt(amount, transaction.paidBy, splitType, partnerId, customSplitPercentage);
      owedBy = debt.owedBy;
      owedAmount = debt.owedAmount;
    }

    transaction.set({
      description: data.description ?? transaction.description,
      amount,
      type: data.type ?? transaction.type,
      date,
      competenceDate,
      categoryId: data.categoryId ?? transaction.categoryId,
      paymentMethod,
      cardId,
      splitType,
      customSplitPercentage,
      owedBy,
      owedAmount,
    });

    await transaction.save();

    return transaction;
  }

  async getTransaction(id: string, householdId: string) {
    const transaction = await Transaction.findOne({ _id: id, householdId, deletedAt: null })
      .populate('categoryId', 'name icon color')
      .populate('paidBy', 'name avatarUrl')
      .populate('owedBy', 'name avatarUrl')
      .populate('cardId', 'name color');

    if (!transaction) {
      throw new Error('Transação não encontrada.');
    }

    return transaction;
  }

  async listTransactions(filters: any, page: number = 1, limit: number = 20, householdId?: string) {
    const skip = (page - 1) * limit;

    const query: any = { deletedAt: null, householdId };

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

  async deleteTransaction(id: string, householdId: string) {
    const transaction = await Transaction.findOneAndDelete({ _id: id, householdId });
    if (!transaction) throw new Error('Transação não encontrada.');
    return transaction;
  }

  async getInstallmentSummary(householdId: string) {
    const now = new Date();

    const groups = await Transaction.aggregate([
      {
        $match: {
          installmentGroupId: { $ne: null },
          deletedAt: null,
          householdId: new mongoose.Types.ObjectId(householdId),
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
