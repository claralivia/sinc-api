import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { CardService } from '../services/CardService';
import { RecurringExpenseService } from '../services/RecurringExpenseService';
import { getOrCreateHouseholdId } from '../services/UserService';
import Category from '../models/Category';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const cardService = new CardService();
  const recurringExpenseService = new RecurringExpenseService();

  const user = await User.findOne();
  const householdId = await getOrCreateHouseholdId(String(user!._id));

  const card = await cardService.createCard({
    name: 'Teste Nubank',
    brand: 'Mastercard',
    logoUrl: 'https://logo.example/nubank.png',
    color: '#8A05BE',
    limit: 500000,
    closingDay: 10,
    dueDay: 17,
    householdId,
  });
  console.log('Cartão criado:', card.name, card.logoUrl);

  const category = await Category.findOne({ type: 'EXPENSE' });

  const recurring = await recurringExpenseService.createRecurringExpense({
    description: 'Teste Netflix',
    amount: 4490,
    categoryId: String(category!._id),
    paymentMethod: 'CREDIT_CARD',
    cardId: String(card._id),
    splitType: 'MINE',
    dueDay: 5,
    householdId,
  });
  console.log('Gasto fixo criado:', recurring.description);

  const launched: any = await recurringExpenseService.launch(String(recurring._id), String(user!._id), new Date(), householdId);
  console.log('Lançado:', launched.description, launched.amount, launched.recurringExpenseId);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  const withStatus = await recurringExpenseService.listWithStatus(start, end, householdId);
  console.log('Status:', withStatus.map((r: any) => ({ description: r.description, paid: r.paid })));

  // cleanup
  const Transaction = mongoose.model('Transaction');
  await Transaction.deleteOne({ _id: launched._id });
  await recurringExpenseService.deleteRecurringExpense(String(recurring._id), householdId);
  await cardService.deleteCard(String(card._id), householdId);
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
