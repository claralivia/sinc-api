import Category from '../models/Category';

export class CategoryService {
  async listCategories() {
    const categories = await Category.find({ deletedAt: null }).sort({ name: 1 });
    return categories;
  }
}
