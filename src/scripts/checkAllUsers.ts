import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const users = await User.find({}).select('email supabaseId role phone');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

run();
