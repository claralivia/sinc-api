import Card from '../models/Card';

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

  async deleteCard(id: string, householdId: string) {
    const card = await Card.findOneAndUpdate({ _id: id, householdId, deletedAt: null }, { deletedAt: new Date() }, { returnDocument: 'after' });

    if (!card) {
      throw new Error('Cartão não encontrado.');
    }

    return card;
  }
}
