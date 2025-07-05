
import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Omit<Product, "id">) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProducts = async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Loading products from Supabase...');
      
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          product_sizes (*)
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setLoading(false);
        return;
      }

      const formattedProducts = productsData?.map(product => ({
        id: product.id,
        name: product.name,
        categoryId: product.category_id,
        isVisible: product.is_active !== false,
        sizes: product.product_sizes?.map((size: any) => ({
          size: size.size,
          cost: Number(size.cost),
          price: Number(size.price)
        })) || []
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (user && mounted) {
        await loadProducts();
      } else if (!user) {
        setProducts([]);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user]);

  const addProduct = async (newProduct: Omit<Product, "id">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Adding new product:', newProduct);
      
      // Insert product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: newProduct.name,
          category_id: newProduct.categoryId,
          is_active: newProduct.isVisible
        })
        .select()
        .single();

      if (productError) {
        console.error('Error inserting product:', productError);
        throw productError;
      }

      console.log('Product inserted successfully:', productData);

      // Insert product sizes
      const productSizes = newProduct.sizes.map(size => ({
        product_id: productData.id,
        size: size.size,
        cost: size.cost,
        price: size.price
      }));

      console.log('Inserting product sizes:', productSizes);

      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(productSizes);

      if (sizesError) {
        console.error('Error inserting product sizes:', sizesError);
        throw sizesError;
      }

      console.log('Product sizes inserted successfully');
      toast.success("تم إضافة المنتج بنجاح");
      await loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("حدث خطأ في إضافة المنتج");
    }
  };

  const updateProduct = async (id: string, updatedProduct: Omit<Product, "id">) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Updating product:', id, updatedProduct);
      
      // Update product name and properties
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          name: updatedProduct.name,
          category_id: updatedProduct.categoryId,
          is_active: updatedProduct.isVisible
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (productError) {
        console.error('Error updating product:', productError);
        throw productError;
      }

      // Delete existing sizes
      const { error: deleteError } = await supabase
        .from('product_sizes')
        .delete()
        .eq('product_id', id);

      if (deleteError) {
        console.error('Error deleting product sizes:', deleteError);
        throw deleteError;
      }

      // Insert new sizes
      const productSizes = updatedProduct.sizes.map(size => ({
        product_id: id,
        size: size.size,
        cost: size.cost,
        price: size.price
      }));

      const { error: sizesError } = await supabase
        .from('product_sizes')
        .insert(productSizes);

      if (sizesError) {
        console.error('Error inserting new product sizes:', sizesError);
        throw sizesError;
      }

      console.log('Product updated successfully');
      toast.success("تم تحديث المنتج بنجاح");
      await loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error("حدث خطأ في تحديث المنتج");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      console.log('Deleting product:', id);
      
      // Delete product (sizes will be deleted automatically due to foreign key)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting product:', error);
        throw error;
      }

      console.log('Product deleted successfully');
      toast.success("تم حذف المنتج بنجاح");
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("حدث خطأ في حذف المنتج");
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      loading
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
