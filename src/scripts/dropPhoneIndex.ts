import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  await User.collection.dropIndex('phone_1');
  console.log('Índice phone_1 removido.');
  console.log(JSON.stringify(await User.collection.indexes(), null, 2));
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
