
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: productsCount },
        { count: ordersCount },
        { count: customersCount },
        { data: ordersData }
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact' }),
        supabase.from('orders').select('*', { count: 'exact' }),
        supabase.from('user_roles').select('*', { count: 'exact' }).eq('role', 'customer'),
        supabase.from('orders').select('total, profit')
      ]);

      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalProfit = ordersData?.reduce((sum, order) => sum + Number(order.profit), 0) || 0;

      return {
        products: productsCount || 0,
        orders: ordersCount || 0,
        customers: customersCount || 0,
        revenue: totalRevenue,
        profit: totalProfit
      };
    }
  });

  const statsCards = [
    {
      title: 'إجمالي المنتجات',
      value: stats?.products || 0,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'إجمالي الطلبات',
      value: stats?.orders || 0,
      icon: ShoppingCart,
      color: 'text-green-600'
    },
    {
      title: 'إجمالي العملاء',
      value: stats?.customers || 0,
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'إجمالي الأرباح',
      value: `${stats?.profit || 0} ج.م`,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">مرحباً بك في لوحة تحكم المتجر</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>أحدث الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersList />
        </CardContent>
      </Card>
    </div>
  );
};

const RecentOrdersList = () => {
  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('date_created', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching recent orders:', error);
        return [];
      }
      
      return data || [];
    }
  });

  if (!recentOrders?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد طلبات حديثة
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentOrders.map((order) => (
        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">طلب #{order.serial}</p>
            <p className="text-sm text-muted-foreground">{order.client_name}</p>
          </div>
          <div className="text-left">
            <p className="font-medium">{order.total} ج.م</p>
            <p className="text-sm text-muted-foreground">{order.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
