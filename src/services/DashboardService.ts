import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Household from '../models/Household';
import User from '../models/User';
import { resolveHouseholdId } from './UserService';

// Compras no cartão só "contam" no mês da fatura (competenceDate); os demais
// meios de pagamento usam a data real da transação.
const effectiveDateExpr = {
  $cond: [{ $eq: ['$paymentMethod', 'CREDIT_CARD'] }, '$competenceDate', '$date'],
};

// Transações antigas nunca tiveram `paidAt` setado — o campo fica ausente, e
// o Mongo trata "ausente" como diferente de `null` num $eq de agregação. O
// $ifNull normaliza os dois casos antes de comparar.
const isPaidExpr = { $ne: [{ $ifNull: ['$paidAt', null] }, null] };

export class DashboardService {
  async getMonthlySummary(startDate: string, endDate: string, userId: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // O frontend manda datas puras ("2026-07-31"), que viram meia-noite UTC —
    // sem isso, transações do último dia (salvas à meia-noite local, ex. 03:00
    // UTC no Brasil) ficariam de fora por já ser "depois" desse instante.
    end.setUTCHours(23, 59, 59, 999);

    const householdId = await resolveHouseholdId(userId);

    if (!householdId) {
      return {
        period: { start, end },
        totals: { totalIncome: 0, totalExpense: 0, balance: 0, paidExpense: 0, pendingExpense: 0 },
        sharedDebt: [],
        expensesByCategory: [],
        cardInvoices: [],
      };
    }

    const householdObjectId = new mongoose.Types.ObjectId(householdId);

    // Agregação 1: Total de Receitas, Despesas e Economia do mês
    const totals = await Transaction.aggregate([
      {
        // 1. Filtra apenas o mês atual (por competência, no caso de cartão), o vínculo (household) do usuário e ignora os deletados
        $match: {
          deletedAt: null,
          householdId: householdObjectId,
          $expr: { $and: [{ $gte: [effectiveDateExpr, start] }, { $lte: [effectiveDateExpr, end] }] }
        }
      },
      {
        // 2. Agrupa e soma os valores separando por tipo. PIX/débito/dinheiro
        // saem do bolso na hora, então sempre contam como "já desembolsado";
        // só o cartão fica pendente até a fatura ser marcada como paga.
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0] }
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0] }
          },
          paidExpense: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'EXPENSE'] }, { $or: [{ $ne: ['$paymentMethod', 'CREDIT_CARD'] }, isPaidExpr] }] },
                '$amount',
                0
              ]
            }
          },
          pendingExpense: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$type', 'EXPENSE'] }, { $eq: ['$paymentMethod', 'CREDIT_CARD'] }, { $not: [isPaidExpr] }] },
                '$amount',
                0
              ]
            }
          }
        }
      },
      {
        // 3. Projeta o resultado final, já calculando o saldo (Economia)
        $project: {
          _id: 0,
          totalIncome: 1,
          totalExpense: 1,
          paidExpense: 1,
          pendingExpense: 1,
          balance: { $subtract: ['$totalIncome', '$totalExpense'] }
        }
      }
    ]);

    // Agregação 2: Conta Conjunta (quanto cada usuário do vínculo está devendo)
    // Usamos aquele campo 'owedAmount' que pré-calculamos de forma inteligente!
    const owedAmounts = await Transaction.aggregate([
      {
        $match: {
          deletedAt: null,
          householdId: householdObjectId,
          owedBy: { $ne: null },
          $expr: { $and: [{ $gte: [effectiveDateExpr, start] }, { $lte: [effectiveDateExpr, end] }] }
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
    const currentTotals = totals[0] || { totalIncome: 0, totalExpense: 0, balance: 0, paidExpense: 0, pendingExpense: 0 };

    // Gastos no cartão de crédito não entram aqui por categoria — eles são
    // consolidados por fatura em `cardInvoices`, já que só "acontecem" de
    // fato no bolso quando a fatura fecha.
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end },
          type: 'EXPENSE',
          paymentMethod: { $ne: 'CREDIT_CARD' },
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

    // Agregação 4: Fatura do mês por cartão (competência, não data da compra)
    const cardInvoices = await Transaction.aggregate([
      {
        $match: {
          type: 'EXPENSE',
          paymentMethod: 'CREDIT_CARD',
          deletedAt: null,
          householdId: householdObjectId,
          competenceDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$cardId',
          total: { $sum: '$amount' },
          unpaidCount: { $sum: { $cond: [{ $not: [isPaidExpr] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'cards',
          localField: '_id',
          foreignField: '_id',
          as: 'cardDetails'
        }
      },
      {
        $project: {
          _id: 0,
          cardId: '$_id',
          cardName: { $arrayElemAt: ['$cardDetails.name', 0] },
          cardColor: { $arrayElemAt: ['$cardDetails.color', 0] },
          cardLogoUrl: { $arrayElemAt: ['$cardDetails.logoUrl', 0] },
          dueDay: { $arrayElemAt: ['$cardDetails.dueDay', 0] },
          total: 1,
          paid: { $eq: ['$unpaidCount', 0] }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // A fatura é sempre marcada como paga por inteiro, então o "mês" da
    // competência (usado pra chamar o endpoint de pagar) é o próprio período consultado.
    // `start` vem de um ISO date-only (parseado como UTC) — getters locais aqui
    // dariam o mês errado num servidor com timezone atrás de UTC.
    const invoiceMonth = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
    const cardInvoicesWithMonth = cardInvoices.map((invoice) => ({ ...invoice, month: invoiceMonth }));

    // Retorno atualizado do dashboard
    return {
      period: { start, end },
      totals: currentTotals,
      sharedDebt,
      expensesByCategory, // Nova chave para o seu gráfico de rosca
      cardInvoices: cardInvoicesWithMonth
    };
  }
}
