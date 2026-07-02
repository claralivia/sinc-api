import User from '../models/User';

export class UserService {
  async listUsers() {
    return await User.find().sort({ name: 1 });
  }

  async updateUser(id: string, data: { name?: string; role?: string; phone?: string; avatarUrl?: string }) {
    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    return user;
  }
}
