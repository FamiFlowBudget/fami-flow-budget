import { Category } from '@/types/budget';

export const getCategoryPath = (categoryId: string, categories: Category[]): string => {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return '';
  
  if (category.parentId) {
    const parentCategory = categories.find(cat => cat.id === category.parentId);
    return parentCategory ? `${parentCategory.name} → ${category.name}` : category.name;
  }
  
  return category.name;
};

export const getCategoryWithSubcategories = (categories: Category[]) => {
  const mainCategories = categories.filter(cat => !cat.parentId);
  const subcategories = categories.filter(cat => cat.parentId);
  
  return mainCategories.map(mainCat => ({
    ...mainCat,
    subcategories: subcategories.filter(sub => sub.parentId === mainCat.id)
  }));
};

export const getAllCategoryIds = (categoryId: string, categories: Category[]): string[] => {
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return [categoryId];
  
  if (category.parentId) {
    // Si es una subcategoría, incluir solo su ID
    return [categoryId];
  } else {
    // Si es una categoría principal, incluir su ID y todas sus subcategorías
    const subcategories = categories.filter(cat => cat.parentId === categoryId);
    return [categoryId, ...subcategories.map(sub => sub.id)];
  }
};