
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string;
  isVisible: boolean;
  user_id: string;
}

interface CategoryContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, "id" | "user_id">) => Promise<void>;
  updateCategory: (id: string, category: Omit<Category, "id" | "user_id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadCategories = async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading categories from Supabase...');
      
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
        setLoading(false);
        return;
      }

      const formattedCategories = categoriesData?.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        isVisible: category.is_active,
        user_id: category.user_id
      })) || [];

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (user && mounted) {
        await loadCategories();
      } else if (!user) {
        setCategories([]);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const addCategory = async (newCategory: Omit<Category, "id" | "user_id">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Adding new category:', newCategory);
      
      const { data: categoryData, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategory.name,
          description: newCategory.description,
          is_active: newCategory.isVisible
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting category:', error);
        throw error;
      }

      console.log('Category inserted successfully:', categoryData);
      toast.success("تم إضافة الفئة بنجاح");
      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("حدث خطأ في إضافة الفئة");
    }
  };

  const updateCategory = async (id: string, updatedCategory: Omit<Category, "id" | "user_id">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Updating category:', id, updatedCategory);
      
      const { error } = await supabase
        .from('categories')
        .update({
          name: updatedCategory.name,
          description: updatedCategory.description,
          is_active: updatedCategory.isVisible
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      console.log('Category updated successfully');
      toast.success("تم تحديث الفئة بنجاح");
      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("حدث خطأ في تحديث الفئة");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Deleting category:', id);
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      console.log('Category deleted successfully');
      toast.success("تم حذف الفئة بنجاح");
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("حدث خطأ في حذف الفئة");
    }
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      loading
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};
