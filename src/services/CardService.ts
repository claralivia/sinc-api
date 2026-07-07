import Card from '../models/Card';
import Transaction from '../models/Transaction';

export class CardService {
  async listCards(householdId: string) {
    return await Card.find({ deletedAt: null, householdId }).sort({ name: 1 });
  }

  async createCard(data: {
    name: string;
    brand: string;
    logoUrl?: string;
    color: string;
    limit: number;
    closingDay: number;
    dueDay: number;
    householdId: string;
  }) {
    return await Card.create(data);
  }

  async updateCard(
    id: string,
    householdId: string,
    data: Partial<{ name: string; brand: string; logoUrl: string; color: string; limit: number; closingDay: number; dueDay: number }>
  ) {
    const card = await Card.findOneAndUpdate({ _id: id, householdId, deletedAt: null }, data, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!card) {
      throw new Error('Cartão não encontrado.');
    }

    return card;
  }

  /** Marca a fatura (cartão + mês de competência) como paga — é isso que separa "já desembolsamos" de "ainda vamos pagar" no dashboard. */
  async markInvoiceAsPaid(id: string, householdId: string, month: string) {
    const card = await Card.findOne({ _id: id, householdId, deletedAt: null });

    if (!card) {
      throw new Error('Cartão não encontrado.');
    }

    const [year, monthNumber] = month.split('-').map(Number);

    if (!year || !monthNumber) {
      throw new Error('Mês inválido. Use o formato YYYY-MM.');
    }

    // Date.UTC em vez do construtor local — o mês vem como texto (sem timezone),
    // então o cálculo não pode depender do timezone do processo do servidor.
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));

    await Transaction.updateMany(
      {
        cardId: id,
        householdId,
        paymentMethod: 'CREDIT_CARD',
        deletedAt: null,
        competenceDate: { $gte: start, $lte: end },
      },
      { paidAt: new Date() }
    );

    return { cardId: id, month, paid: true };
  }

  async deleteCard(id: string, householdId: string) {
    const card = await Card.findOneAndUpdate({ _id: id, householdId, deletedAt: null }, { deletedAt: new Date() }, { returnDocument: 'after' });

    if (!card) {
      throw new Error('Cartão não encontrado.');
    }

    return card;
  }
}
