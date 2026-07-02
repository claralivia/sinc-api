import mongoose from 'mongoose';
import Transaction from '../models/Transaction';

export class DashboardService {
  async getMonthlySummary(startDate: string, endDate: string, userId: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Agregação 1: Total de Receitas, Despesas e Economia do mês
    const totals = await Transaction.aggregate([
      {
        // 1. Filtra apenas o mês atual e ignora os deletados
        $match: {
          date: { $gte: start, $lte: end },
          deletedAt: null
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

    // Agregação 2: Conta Conjunta (Quem deve a quem)
    // Usamos aquele campo 'owedAmount' que pré-calculamos de forma inteligente!
    const sharedDebt = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          deletedAt: null,
          owedBy: { $ne: null } // Pega apenas transações que geraram dívida
        }
      },
      {
        $group: {
          _id: '$owedBy',
          totalOwed: { $sum: '$owedAmount' }
        }
      }
    ]);

    // O MongoDB retorna um array vazio se não houver dados no mês. 
    // Usamos o Optional Chaining e fallback para evitar erros no frontend.
    const currentTotals = totals[0] || { totalIncome: 0, totalExpense: 0, balance: 0 };

    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          type: 'EXPENSE',
          deletedAt: null
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
          total: 1
        }
      }
    ]);

    // Retorno atualizado do dashboard
    return {
      period: { start, end },
      totals: currentTotals,
      sharedDebt: sharedDebt.map(debt => ({ userId: debt._id, amount: debt.totalOwed })),
      expensesByCategory // Nova chave para o seu gráfico de rosca
    };
  }
}