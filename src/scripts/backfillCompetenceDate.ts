import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Card from '../models/Card';

dns.setServers(['8.8.8.8', '1.1.1.1']);

function computeCompetenceDate(date: Date, paymentMethod: string, closingDay?: number): Date {
  if (paymentMethod !== 'CREDIT_CARD' || !closingDay) {
    return date;
  }

  const competenceDate = new Date(date);
  if (competenceDate.getDate() > closingDay) {
    competenceDate.setMonth(competenceDate.getMonth() + 1);
  }

  return competenceDate;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const cards = await Card.find().select('closingDay');
  const closingDayByCardId = new Map(cards.map((card) => [card._id.toString(), card.closingDay]));

  const transactions = await Transaction.find({ competenceDate: { $exists: false } }).select(
    'date paymentMethod cardId'
  );

  console.log(`${transactions.length} transações sem competenceDate.`);

  let updated = 0;
  const bulkOps = transactions.map((transaction) => {
    const closingDay = transaction.cardId ? closingDayByCardId.get(transaction.cardId.toString()) : undefined;
    const competenceDate = computeCompetenceDate(transaction.date, transaction.paymentMethod, closingDay);
    updated++;
    return {
      updateOne: {
        filter: { _id: transaction._id },
        update: { $set: { competenceDate } },
      },
    };
  });

  if (bulkOps.length) {
    await Transaction.collection.bulkWrite(bulkOps);
  }

  console.log(`${updated} transações atualizadas com competenceDate.`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
