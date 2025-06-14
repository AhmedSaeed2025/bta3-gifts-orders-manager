import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncAllData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only sync data on initial sign in, not on token refresh
        if (event === 'SIGNED_IN' && session?.user) {
          // Delay sync to avoid loading conflicts
          setTimeout(() => {
            if (mounted) {
              syncAllData();
            }
          }, 2000);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncAllData = async () => {
    if (!user) return;

    try {
      console.log('بدء مزامنة البيانات المحلية...');
      
      await Promise.all([
        syncOrders(),
        syncProducts(),
        syncProposedPrices()
      ]);
      
      console.log('تمت مزامنة جميع البيانات بنجاح');
      
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
    }
  };

  const syncOrders = async () => {
    try {
      const localOrders = localStorage.getItem('orders');
      if (!localOrders || !user) return;

      const orders = JSON.parse(localOrders);
      if (orders.length === 0) return;

      console.log('مزامنة الطلبات...', orders.length, 'طلب');

      let syncedCount = 0;
      for (const order of orders) {
        try {
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('serial')
            .eq('serial', order.serial)
            .eq('user_id', user.id)
            .single();

          if (existingOrder) {
            continue;
          }

          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: user.id,
              serial: order.serial,
              payment_method: order.paymentMethod,
              client_name: order.clientName,
              phone: order.phone,
              delivery_method: order.deliveryMethod,
              address: order.address || '',
              governorate: order.governorate || '',
              shipping_cost: order.shippingCost || 0,
              discount: order.discount || 0,
              deposit: order.deposit || 0,
              total: order.total,
              profit: order.profit,
              status: order.status,
              date_created: order.dateCreated
            })
            .select()
            .single();

          if (orderError) {
            console.error('خطأ في إضافة الطلب:', orderError);
            continue;
          }

          if (order.items && order.items.length > 0) {
            const orderItems = order.items.map((item: any) => ({
              order_id: orderData.id,
              product_type: item.productType,
              size: item.size,
              quantity: item.quantity,
              cost: item.cost,
              price: item.price,
              profit: item.profit
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('خطأ في إضافة عناصر الطلب:', itemsError);
            }
          }

          syncedCount++;
        } catch (error) {
          console.error('خطأ في مزامنة الطلب:', order.serial, error);
        }
      }

      if (syncedCount > 0) {
        console.log(`تم مزامنة ${syncedCount} طلب`);
      }
    } catch (error) {
      console.error('خطأ في مزامنة الطلبات:', error);
    }
  };

  const syncProducts = async () => {
    try {
      const localProducts = localStorage.getItem('products');
      if (!localProducts || !user) return;

      const products = JSON.parse(localProducts);
      if (products.length === 0) return;

      console.log('مزامنة المنتجات...', products.length, 'منتج');

      let syncedCount = 0;
      for (const product of products) {
        try {
          // التحقق من وجود المنتج
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('name', product.name)
            .eq('user_id', user.id)
            .single();

          let productId;
          if (existingProduct) {
            productId = existingProduct.id;
          } else {
            // إضافة المنتج الجديد
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                user_id: user.id,
                name: product.name
              })
              .select()
              .single();

            if (productError) {
              console.error('خطأ في إضافة المنتج:', productError);
              continue;
            }
            productId = newProduct.id;
          }

          // مزامنة مقاسات المنتج
          if (product.sizes && product.sizes.length > 0) {
            for (const size of product.sizes) {
              const { data: existingSize } = await supabase
                .from('product_sizes')
                .select('id')
                .eq('product_id', productId)
                .eq('size', size.size)
                .single();

              if (!existingSize) {
                await supabase
                  .from('product_sizes')
                  .insert({
                    product_id: productId,
                    size: size.size,
                    cost: size.cost,
                    price: size.price
                  });
              }
            }
          }

          syncedCount++;
        } catch (error) {
          console.error('خطأ في مزامنة المنتج:', product.name, error);
        }
      }

      if (syncedCount > 0) {
        console.log(`تم مزامنة ${syncedCount} منتج`);
      }
    } catch (error) {
      console.error('خطأ في مزامنة المنتجات:', error);
    }
  };

  const syncProposedPrices = async () => {
    try {
      const localProposedPrices = localStorage.getItem('proposedPrices');
      if (!localProposedPrices || !user) return;

      const proposedPrices = JSON.parse(localProposedPrices);
      if (Object.keys(proposedPrices).length === 0) return;

      console.log('مزامنة الأسعار المقترحة...');

      let syncedCount = 0;
      for (const [productType, sizes] of Object.entries(proposedPrices)) {
        for (const [size, priceData] of Object.entries(sizes as any)) {
          try {
            // التحقق من وجود السعر المقترح
            const { data: existingPrice } = await supabase
              .from('proposed_prices')
              .select('id')
              .eq('product_type', productType)
              .eq('size', size)
              .eq('user_id', user.id)
              .single();

            if (!existingPrice) {
              await supabase
                .from('proposed_prices')
                .insert({
                  user_id: user.id,
                  product_type: productType,
                  size: size,
                  cost: (priceData as any).cost,
                  price: (priceData as any).price
                });
              syncedCount++;
            }
          } catch (error) {
            console.error('خطأ في مزامنة السعر المقترح:', productType, size, error);
          }
        }
      }

      if (syncedCount > 0) {
        console.log(`تم مزامنة ${syncedCount} سعر مقترح`);
      }
    } catch (error) {
      console.error('خطأ في مزامنة الأسعار المقترحة:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signInWithEmail,
      signUpWithEmail,
      signOut,
      syncAllData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
