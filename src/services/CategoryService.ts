import Category from '../models/Category';

export class CategoryService {
  async listCategories() {
    const categories = await Category.find({ deletedAt: null }).sort({ name: 1 });
    return categories;
  }

  async createCategory(data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string; color: string }) {
    return await Category.create(data);
  }

  async updateCategory(id: string, data: { name?: string; type?: 'INCOME' | 'EXPENSE'; icon?: string; color?: string }) {
    const category = await Category.findOneAndUpdate(
      { _id: id, deletedAt: null },
      data,
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }

  async deleteCategory(id: string) {
    const category = await Category.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!category) {
      throw new Error('Categoria não encontrada.');
    }

    return category;
  }
}
