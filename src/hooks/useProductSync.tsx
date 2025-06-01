
import { useState, useEffect } from 'react';
import { useProducts } from '@/context/ProductContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Product, ProductSize } from '@/types';
import { toast } from 'sonner';

export const useProductSync = () => {
  const { products, addProduct, updateProduct, deleteProduct, addProductSize, updateProductSize, deleteProductSize } = useProducts();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Sync products to Supabase
  const syncToSupabase = async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      // First, get existing products from Supabase
      const { data: existingProducts, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_sizes (
            id,
            size,
            cost,
            price
          )
        `)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Sync local products to Supabase
      for (const localProduct of products) {
        const existingProduct = existingProducts?.find(p => p.name === localProduct.name);
        
        if (!existingProduct) {
          // Create new product
          const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert({
              name: localProduct.name,
              user_id: user.id
            })
            .select()
            .single();

          if (productError) throw productError;

          // Add sizes for the new product
          if (localProduct.sizes.length > 0) {
            const sizesToInsert = localProduct.sizes.map(size => ({
              product_id: newProduct.id,
              size: size.size,
              cost: size.cost,
              price: size.price
            }));

            const { error: sizesError } = await supabase
              .from('product_sizes')
              .insert(sizesToInsert);

            if (sizesError) throw sizesError;
          }
        } else {
          // Update existing product if needed
          if (existingProduct.name !== localProduct.name) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ name: localProduct.name })
              .eq('id', existingProduct.id);

            if (updateError) throw updateError;
          }

          // Sync sizes
          const existingSizes = existingProduct.product_sizes || [];
          
          // Add new sizes
          for (const localSize of localProduct.sizes) {
            const existingSize = existingSizes.find(s => s.size === localSize.size);
            if (!existingSize) {
              const { error: sizeError } = await supabase
                .from('product_sizes')
                .insert({
                  product_id: existingProduct.id,
                  size: localSize.size,
                  cost: localSize.cost,
                  price: localSize.price
                });

              if (sizeError) throw sizeError;
            } else if (existingSize.cost !== localSize.cost || existingSize.price !== localSize.price) {
              // Update existing size
              const { error: updateSizeError } = await supabase
                .from('product_sizes')
                .update({
                  cost: localSize.cost,
                  price: localSize.price
                })
                .eq('id', existingSize.id);

              if (updateSizeError) throw updateSizeError;
            }
          }

          // Remove sizes that don't exist locally
          for (const existingSize of existingSizes) {
            const localSize = localProduct.sizes.find(s => s.size === existingSize.size);
            if (!localSize) {
              const { error: deleteError } = await supabase
                .from('product_sizes')
                .delete()
                .eq('id', existingSize.id);

              if (deleteError) throw deleteError;
            }
          }
        }
      }

      // Remove products that don't exist locally
      if (existingProducts) {
        for (const existingProduct of existingProducts) {
          const localProduct = products.find(p => p.name === existingProduct.name);
          if (!localProduct) {
            // Delete sizes first
            const { error: deleteSizesError } = await supabase
              .from('product_sizes')
              .delete()
              .eq('product_id', existingProduct.id);

            if (deleteSizesError) throw deleteSizesError;

            // Delete product
            const { error: deleteProductError } = await supabase
              .from('products')
              .delete()
              .eq('id', existingProduct.id);

            if (deleteProductError) throw deleteProductError;
          }
        }
      }

      setSyncStatus('idle');
      toast.success('تم مزامنة المنتجات بنجاح');
    } catch (error) {
      console.error('Product sync error:', error);
      setSyncStatus('error');
      toast.error('فشل في مزامنة المنتجات');
    }
  };

  // Sync products from Supabase to local
  const syncFromSupabase = async () => {
    if (!user) return;
    
    setSyncStatus('syncing');
    try {
      const { data: supabaseProducts, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_sizes (
            id,
            size,
            cost,
            price
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (supabaseProducts && supabaseProducts.length > 0) {
        // Convert Supabase format to local format
        const convertedProducts: Product[] = supabaseProducts.map(product => ({
          id: product.id,
          name: product.name,
          sizes: (product.product_sizes || []).map((size: any) => ({
            size: size.size,
            cost: size.cost,
            price: size.price
          }))
        }));

        // Update local storage
        localStorage.setItem('products', JSON.stringify(convertedProducts));
        
        // Reload the page to update the context
        window.location.reload();
      }

      setSyncStatus('idle');
      toast.success('تم تحديث المنتجات من السيرفر');
    } catch (error) {
      console.error('Product sync from Supabase error:', error);
      setSyncStatus('error');
      toast.error('فشل في تحديث المنتجات من السيرفر');
    }
  };

  return {
    syncStatus,
    syncToSupabase,
    syncFromSupabase
  };
};
