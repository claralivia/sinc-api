import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import Category from '../models/Category';

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Cores da paleta categórica validada (dataviz skill) para o modo escuro,
// em ordem fixa. "Outros" sempre recebe o cinza neutro, nunca uma cor da sequência.
const categories = [
  { name: 'Alimentação', type: 'EXPENSE', icon: '🍔', color: '#3987e5' },
  { name: 'Transporte', type: 'EXPENSE', icon: '🚗', color: '#199e70' },
  { name: 'Moradia', type: 'EXPENSE', icon: '🏠', color: '#c98500' },
  { name: 'Saúde', type: 'EXPENSE', icon: '💊', color: '#008300' },
  { name: 'Lazer', type: 'EXPENSE', icon: '🎉', color: '#9085e9' },
  { name: 'Compras', type: 'EXPENSE', icon: '🛍️', color: '#e66767' },
  { name: 'Assinaturas', type: 'EXPENSE', icon: '📱', color: '#d55181' },
  { name: 'Educação', type: 'EXPENSE', icon: '📚', color: '#d95926' },
  { name: 'Restaurante', type: 'EXPENSE', icon: '🍽️', color: '#1f9e8f' },
  { name: 'Super Mercado', type: 'EXPENSE', icon: '🛒', color: '#7a9a1f' },
  { name: 'Presentes', type: 'EXPENSE', icon: '🎁', color: '#c25ec2' },
  { name: 'Bebidas', type: 'EXPENSE', icon: '🍹', color: '#b8752e' },
  { name: 'Outros', type: 'EXPENSE', icon: '📦', color: '#898781' },
  { name: 'Salário', type: 'INCOME', icon: '💰', color: '#3987e5' },
  { name: 'Freelance', type: 'INCOME', icon: '💻', color: '#199e70' },
  { name: 'Investimentos', type: 'INCOME', icon: '📈', color: '#c98500' },
  { name: 'Outros', type: 'INCOME', icon: '📦', color: '#898781' },
] as const;

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);

  for (const category of categories) {
    await Category.findOneAndUpdate(
      { name: category.name, type: category.type },
      category,
      { upsert: true, returnDocument: 'after' }
    );
  }

  console.log(`${categories.length} categorias cadastradas/atualizadas.`);
  await mongoose.disconnect();
}

seed();
