import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const byEmail = await User.find({ email: 'claramoura2303@gmail.com' });
  console.log('Por email:', JSON.stringify(byEmail, null, 2));

  const bySupabaseId = await User.find({ supabaseId: '2cae2081-c790-4e2e-83e8-d3e3e6079da7' });
  console.log('Por supabaseId:', JSON.stringify(bySupabaseId, null, 2));

  const indexes = await User.collection.indexes();
  console.log('Indexes:', JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
