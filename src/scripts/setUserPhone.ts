import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const phoneByEmail: Record<string, string> = {
  'claramoura2303@gmail.com': '5585985348222',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  for (const [email, phone] of Object.entries(phoneByEmail)) {
    const user = await User.findOneAndUpdate({ email }, { phone }, { returnDocument: 'after' });

    if (!user) {
      console.log(`Usuário não encontrado ainda: ${email}`);
      continue;
    }

    console.log(`${email} -> ${phone}`);
  }

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
