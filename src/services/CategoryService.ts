import Category from '../models/Category';

export class CategoryService {
  async listCategories(householdId: string) {
    const categories = await Category.find({ deletedAt: null, householdId }).sort({ name: 1 });
    return categories;
  }

  async createCategory(data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string; color: string; householdId: string }) {
    return await Category.create(data);
  }

  async updateCategory(id: string, householdId: string, data: { name?: string; type?: 'INCOME' | 'EXPENSE'; icon?: string; color?: string }) {
    const category = await Category.findOneAndUpdate(
      { _id: id, householdId, deletedAt: null },
      data,
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }

  async deleteCategory(id: string, householdId: string) {
    const category = await Category.findOneAndUpdate(
      { _id: id, householdId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }
}
