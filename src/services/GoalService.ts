import Goal from '../models/Goal';

export class GoalService {
  async listGoals() {
    return await Goal.find({ deletedAt: null }).sort({ createdAt: 1 });
  }

  async createGoal(data: { name: string; icon: string; color: string; targetAmount: number }) {
    return await Goal.create(data);
  }

  async updateGoal(id: string, data: { name?: string; icon?: string; color?: string; targetAmount?: number }) {
    const goal = await Goal.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
      new: true,
      runValidators: true,
    });

    if (!goal) {
      throw new Error('Meta não encontrada.');
    }

    return goal;
  }

  async deleteGoal(id: string) {
    const goal = await Goal.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date() }, { new: true });

    if (!goal) {
      throw new Error('Meta não encontrada.');
    }

    return goal;
  }

  async contribute(id: string, amount: number) {
    const goal = await Goal.findOne({ _id: id, deletedAt: null });

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
