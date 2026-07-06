import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';
import { GoalService } from '../services/GoalService';
import { getOrCreateHouseholdId } from '../services/UserService';
import User from '../models/User';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const goalService = new GoalService();

  const user = await User.findOne();
  const householdId = await getOrCreateHouseholdId(String(user!._id));

  const created = await goalService.createGoal({ name: 'Teste Viagem', icon: '✈️', color: '#0A84FF', targetAmount: 500000, householdId });
  console.log('Criado:', created.name, created.targetAmount);

  await goalService.contribute(created.id, householdId, 10000);
  const afterDeposit = await goalService.contribute(created.id, householdId, 5000);
  console.log('Após 2 depósitos:', afterDeposit.currentAmount);

  await goalService.contribute(created.id, householdId, -3000);
  const list = await goalService.listGoals(householdId);
  console.log('Total de metas ativas:', list.length);

  await goalService.deleteGoal(created.id, householdId);
  const listAfterDelete = await goalService.listGoals(householdId);
  console.log('Total após exclusão:', listAfterDelete.length);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('ERRO:', error);
  process.exit(1);
});
