import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Household from '../models/Household';
import User from '../models/User';
import { resolveHouseholdId } from './UserService';

export class DashboardService {
  async getMonthlySummary(startDate: string, endDate: string, userId: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const householdId = await resolveHouseholdId(userId);

    if (!householdId) {
      return {
        period: { start, end },
        totals: { totalIncome: 0, totalExpense: 0, balance: 0 },
        sharedDebt: [],
        expensesByCategory: [],
      };
    }

    const householdObjectId = new mongoose.Types.ObjectId(householdId);

    // Agregação 1: Total de Receitas, Despesas e Economia do mês
    const totals = await Transaction.aggregate([
      {
        // 1. Filtra apenas o mês atual, o vínculo (household) do usuário e ignora os deletados
        $match: {
          date: { $gte: start, $lte: end },
          deletedAt: null,
          householdId: householdObjectId
        }
      },
      {
        // 2. Agrupa e soma os valores separando por tipo
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0] }
          }
        }
      },
      {
        // 3. Projeta o resultado final, já calculando o saldo (Economia)
        $project: {
          _id: 0,
          totalIncome: 1,
          totalExpense: 1,
          balance: { $subtract: ['$totalIncome', '$totalExpense'] }
        }
      }
    ]);

    // Agregação 2: Conta Conjunta (quanto cada usuário do vínculo está devendo)
    // Usamos aquele campo 'owedAmount' que pré-calculamos de forma inteligente!
    const owedAmounts = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          deletedAt: null,
          householdId: householdObjectId,
          owedBy: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$owedBy',
          totalOwed: { $sum: '$owedAmount' }
        }
      }
    ]);

    const owedAmountByUserId = new Map(owedAmounts.map((entry) => [entry._id.toString(), entry.totalOwed]));

    // Sempre lista todos os usuários do vínculo, mesmo quem não deve nada no período.
    const household = await Household.findById(householdId).select('members');
    const memberIds = household?.members || [];

    const sharedDebt = memberIds.length > 1
      ? (await User.find({ _id: { $in: memberIds } }).select('name').sort({ name: 1 })).map((member) => ({
          userId: member._id,
          userName: member.name,
          amount: owedAmountByUserId.get(member._id.toString()) || 0
        }))
      : [];

    // O MongoDB retorna um array vazio se não houver dados no mês.
    // Usamos o Optional Chaining e fallback para evitar erros no frontend.
    const currentTotals = totals[0] || { totalIncome: 0, totalExpense: 0, balance: 0 };

    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          type: 'EXPENSE',
          deletedAt: null,
          householdId: householdObjectId
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories', // Nome da coleção no MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      {
        $project: {
          _id: 0,
          categoryName: { $arrayElemAt: ['$categoryDetails.name', 0] },
          categoryColor: { $arrayElemAt: ['$categoryDetails.color', 0] },
          categoryIcon: { $arrayElemAt: ['$categoryDetails.icon', 0] },
          total: 1
        }
      }
    ]);

    // Retorno atualizado do dashboard
    return {
      period: { start, end },
      totals: currentTotals,
      sharedDebt,
      expensesByCategory // Nova chave para o seu gráfico de rosca
    };
  }
}
