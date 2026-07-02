import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { GoalService } from '../services/GoalService';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const goalService = new GoalService();

  const created = await goalService.createGoal({ name: 'Teste Viagem', icon: '✈️', color: '#0A84FF', targetAmount: 500000 });
  console.log('Criado:', created.name, created.targetAmount);

  await goalService.contribute(created.id, 10000);
  const afterDeposit = await goalService.contribute(created.id, 5000);
  console.log('Após 2 depósitos:', afterDeposit.currentAmount);

  await goalService.contribute(created.id, -3000);
  const list = await goalService.listGoals();
  console.log('Total de metas ativas:', list.length);

  await goalService.deleteGoal(created.id);
  const listAfterDelete = await goalService.listGoals();
  console.log('Total após exclusão:', listAfterDelete.length);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
