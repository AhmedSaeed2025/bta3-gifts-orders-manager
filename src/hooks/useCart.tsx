
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
    if (!user) {
      // Handle guest cart from localStorage
      const guestCart = localStorage.getItem('guest_cart');
      if (guestCart) {
        setCartItems(JSON.parse(guestCart));
      }
      return;
    }

    try {
      setLoading(true);
      
      // Get user's cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        // Create cart if doesn't exist
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      if (cart) {
        const { data: items } = await supabase
          .from('cart_items')
          .select(`
            *,
            product:products (
              name,
              product_images (image_url, is_primary)
            )
          `)
          .eq('cart_id', cart.id);

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

      if (!user) {
        // Handle guest cart
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const existingItem = guestCart.find((item: any) => 
          item.product_id === productId && item.size === size
        );

        if (existingItem) {
          existingItem.quantity += quantity;
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
        toast.success('تم إضافة المنتج للسلة');
        return;
      }

      // Get or create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        cart = newCart;
      }

      if (!cart) return;

      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id)
        .eq('product_id', productId)
        .eq('size', size)
        .single();

      if (existingItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        // Add new item
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            product_id: productId,
            size,
            quantity,
            price
          });
      }

      await loadCartItems();
      toast.success('تم إضافة المنتج للسلة');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('حدث خطأ في إضافة المنتج');
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

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

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
