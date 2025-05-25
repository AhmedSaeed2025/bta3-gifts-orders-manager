import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncLocalData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Auto-sync local data when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            syncLocalData();
          }, 1000); // Delay to ensure database is ready
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncLocalData = async () => {
    try {
      const localOrders = localStorage.getItem('orders');
      if (!localOrders || !user) return;

      const orders = JSON.parse(localOrders);
      if (orders.length === 0) return;

      console.log('بدء مزامنة البيانات المحلية...', orders.length, 'طلب');
      toast.info(`جاري مزامنة ${orders.length} طلب من التخزين المحلي...`);

      let syncedCount = 0;
      for (const order of orders) {
        try {
          // التحقق من وجود الطلب في قاعدة البيانات أولاً
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('serial')
            .eq('serial', order.serial)
            .single();

          if (existingOrder) {
            console.log('الطلب موجود بالفعل:', order.serial);
            continue; // تخطي إذا كان موجود
          }

          // إضافة الطلب إلى قاعدة البيانات
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

          // إضافة عناصر الطلب
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
          console.log('تم مزامنة الطلب:', order.serial);
        } catch (error) {
          console.error('خطأ في مزامنة الطلب:', order.serial, error);
        }
      }

      if (syncedCount > 0) {
        toast.success(`تم مزامنة ${syncedCount} طلب بنجاح إلى قاعدة البيانات`);
        // اختياري: احتفظ بنسخة احتياطية من البيانات المحلية
        localStorage.setItem('orders_backup', localOrders);
        console.log('تم إنشاء نسخة احتياطية من البيانات المحلية');
      } else {
        toast.info('جميع البيانات متزامنة بالفعل');
      }
    } catch (error) {
      console.error('خطأ في مزامنة البيانات:', error);
      toast.error('حدث خطأ أثناء مزامنة البيانات المحلية');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('فشل في تسجيل الدخول عبر Google. تأكد من تفعيل Google Auth في Supabase أو استخدم البريد الإلكتروني.');
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
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      signOut,
      syncLocalData
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
