import Goal from '../models/Goal';

export class GoalService {
  async listGoals(householdId: string) {
    return await Goal.find({ deletedAt: null, householdId }).sort({ createdAt: 1 });
  }

  async createGoal(data: { name: string; icon: string; color: string; targetAmount: number; householdId: string }) {
    return await Goal.create(data);
  }

  async updateGoal(id: string, householdId: string, data: { name?: string; icon?: string; color?: string; targetAmount?: number }) {
    const goal = await Goal.findOneAndUpdate({ _id: id, householdId, deletedAt: null }, data, {
      new: true,
      runValidators: true,
    });

    if (!goal) {
      throw new Error('Meta não encontrada.');
    }

    return goal;
  }

  async deleteGoal(id: string, householdId: string) {
    const goal = await Goal.findOneAndUpdate({ _id: id, householdId, deletedAt: null }, { deletedAt: new Date() }, { new: true });

    if (!goal) {
      throw new Error('Meta não encontrada.');
    }

    return goal;
  }

  async contribute(id: string, householdId: string, amount: number) {
    const goal = await Goal.findOne({ _id: id, householdId, deletedAt: null });

    if (!goal) {
      throw new Error('Meta não encontrada.');
    }

    const nextAmount = goal.currentAmount + amount;

    if (nextAmount < 0) {
      throw new Error('Não é possível retirar mais do que o valor guardado.');
    }

    goal.currentAmount = nextAmount;
    await goal.save();

    return goal;
  }
}
