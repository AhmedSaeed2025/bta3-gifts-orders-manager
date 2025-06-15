import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  size: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    product_images?: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, size: string, quantity: number, price: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loading: boolean;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart items
  const loadCartItems = async () => {
    console.log('Loading cart items...');
    
    if (!user) {
      // Handle guest cart from localStorage
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        const items = JSON.parse(guestCart);
        console.log('Loaded guest cart items:', items);
        setCartItems(items);
      }
      return;
    }

    try {
      setLoading(true);
      console.log('Loading cart for user:', user.id);
      
      // Get user's cart - fix: limit to 1 and order by created_at
      let { data: carts } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let cart = carts?.[0];

      if (!cart) {
        // Create cart if doesn't exist
        console.log('Creating new cart for user');
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating cart:', createError);
          return;
        }
        cart = newCart;
      }

      if (cart) {
        console.log('Loading cart items for cart:', cart.id);
        const { data: items, error } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products (
              name,
              product_images (image_url, is_primary)
            )
          `)
          .eq('cart_id', cart.id);

        if (error) {
          console.error('Error loading cart items:', error);
          return;
        }

        console.log('Loaded cart items:', items);
        setCartItems(items || []);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCartItems();
  }, [user]);

  const addToCart = async (productId: string, size: string, quantity: number, price: number) => {
    try {
      setLoading(true);
      console.log('Adding to cart:', { productId, size, quantity, price });

      if (!user) {
        // Handle guest cart
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const existingItemIndex = guestCart.findIndex((item: any) => 
          item.product_id === productId && item.size === size
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity += quantity;
        } else {
          guestCart.push({
            id: Date.now().toString(),
            product_id: productId,
            size,
            quantity,
            price
          });
        }

        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
        setCartItems(guestCart);
        console.log('Added to guest cart:', guestCart);
        return;
      }

      // Get user's most recent cart - fix: limit to 1 and order by created_at
      let { data: carts } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let cart = carts?.[0];

      if (!cart) {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating cart:', createError);
          throw createError;
        }
        cart = newCart;
      }

      if (!cart) {
        throw new Error('Unable to create or get cart');
      }

      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .eq('size', size)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (updateError) {
          console.error('Error updating cart item:', updateError);
          throw updateError;
        }
      } else {
        // Add new item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            size,
            quantity,
            price
          });

        if (insertError) {
          console.error('Error inserting cart item:', insertError);
          throw insertError;
        }
      }

      await loadCartItems();
      console.log('Successfully added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);

      if (!user) {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const updatedCart = guestCart.map((item: any) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        return;
      }

      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      await loadCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('حدث خطأ في تحديث الكمية');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);

      if (!user) {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const updatedCart = guestCart.filter((item: any) => item.id !== itemId);
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        setCartItems(updatedCart);
        toast.success('تم حذف المنتج من السلة');
        return;
      }

      await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      await loadCartItems();
      toast.success('تم حذف المنتج من السلة');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('حدث خطأ في حذف المنتج');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);

      if (!user) {
        localStorage.removeItem('guest_cart');
        setCartItems([]);
        return;
      }

      const { data: carts } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const cart = carts?.[0];

      if (cart) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
      }

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      loading,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
