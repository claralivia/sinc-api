import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { AIService } from '../services/AIService';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);

  const aiService = new AIService();

  try {
    const result = await aiService.parseFinancialText('Almoço 35 reais no crédito');
    console.log('OK:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('ERRO REAL:', error);
  }

  await mongoose.disconnect();
}

run();
