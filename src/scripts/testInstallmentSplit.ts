import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { TransactionService } from '../services/TransactionService';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const svc = new TransactionService();
  const category = await Category.findOne({ type: 'EXPENSE' });
  const fakePaidBy = new mongoose.Types.ObjectId();
  const fakePartner = new mongoose.Types.ObjectId();

  const result: any = await svc.createTransaction({
    description: 'TESTE parcelado 50/50',
    amount: 10000,
    type: 'EXPENSE',
    date: new Date(),
    categoryId: category!._id,
    paidBy: fakePaidBy,
    splitType: 'SHARED_50_50',
    paymentMethod: 'CREDIT_CARD',
    totalInstallments: 3,
    isRecurring: false,
    partnerId: fakePartner,
  } as any);

  console.log(result.map((t: any) => ({ n: t.installmentNumber, amount: t.amount, owedAmount: t.owedAmount, owedBy: t.owedBy })));

  const ids = result.map((t: any) => t._id);
  await Transaction.deleteMany({ _id: { $in: ids } });
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
