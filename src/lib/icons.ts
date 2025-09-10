import * as Icons from 'lucide-react';
import { Category } from '@/types/budget';

/**
 * Gets the icon component for a given icon name, with fallback to Tag icon
 */
export const getIconComponent = (iconName: string): React.ComponentType<{ className?: string }> => {
  const IconComponent = (Icons as any)[iconName] || Icons.Tag;
  return IconComponent;
};

/**
 * Gets the icon component for a category, using the category's defined icon
 */
export const getCategoryIconComponent = (
  category: Category, 
  categories: Category[] = []
): React.ComponentType<{ className?: string }> => {
  // If we have the category object, use its icon directly
  if (category?.icon) {
    return getIconComponent(category.icon);
  }
  
  // Fallback: try to find the category by id in the categories array
  const foundCategory = categories.find(c => c.id === category?.id);
  if (foundCategory?.icon) {
    return getIconComponent(foundCategory.icon);
  }
  
  // Final fallback
  return Icons.Tag;
};

/**
 * Gets the icon component by category ID from a categories array
 */
export const getCategoryIconById = (
  categoryId: string, 
  categories: Category[]
): React.ComponentType<{ className?: string }> => {
  const category = categories.find(c => c.id === categoryId);
  return category ? getIconComponent(category.icon) : Icons.Tag;
};

/**
 * Gets the icon component by category name (for backward compatibility)
 * This should be phased out in favor of using category objects
 */
export const getCategoryIconByName = (
  categoryName: string, 
  categories: Category[]
): React.ComponentType<{ className?: string }> => {
  const category = categories.find(c => c.name === categoryName);
  return category ? getIconComponent(category.icon) : Icons.Tag;
};