
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Settings,
  BarChart3,
} from "lucide-react";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import CustomersTab from "./CustomersTab";
import SettingsTab from "./SettingsTab";
import ImprovedAccountStatement from "./ImprovedAccountStatement";

const AdminDashboard = () => {
  const { orders, loading } = useSupabaseOrders();
  const isMobile = useIsMobile();

  // Calculate dashboard stats
  const stats = React.useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders
    };
  }, [orders]);

  const StatCard = ({ title, value, icon: Icon, color = "text-blue-600" }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
  }) => (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-2' : 'justify-between'}`}>
          <div className={isMobile ? 'order-2' : ''}>
            <p className={`text-sm font-medium text-muted-foreground ${isMobile ? 'text-xs text-center' : ''}`}>
              {title}
            </p>
            <p className={`font-bold ${color} ${isMobile ? 'text-base' : 'text-2xl'}`}>
              {value}
            </p>
          </div>
          <Icon className={`${color} ${isMobile ? 'h-8 w-8 order-1' : 'h-8 w-8'}`} />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary"></div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto space-y-6 ${isMobile ? 'p-2' : 'p-4'}`} dir="rtl">
      <div className="mb-6">
        <h1 className={`font-bold text-gift-primary ${isMobile ? 'text-lg' : 'text-3xl'}`}>
          لوحة التحكم
        </h1>
        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-base'}`}>
          إدارة متجرك وطلباتك
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="text-blue-600"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="text-green-600"
        />
        <StatCard
          title="الطلبات المعلقة"
          value={stats.pendingOrders}
          icon={TrendingUp}
          color="text-orange-600"
        />
        <StatCard
          title="الطلبات المكتملة"
          value={stats.completedOrders}
          icon={Users}
          color="text-purple-600"
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList 
          className={`grid w-full ${
            isMobile 
              ? 'grid-cols-2 h-auto gap-1 p-1' 
              : 'grid-cols-4'
          }`}
        >
          <TabsTrigger 
            value="orders" 
            className={`flex items-center gap-2 ${
              isMobile 
                ? 'flex-col p-2 text-xs h-auto' 
                : ''
            }`}
          >
            <ShoppingBag className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
            <span>الطلبات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="products" 
            className={`flex items-center gap-2 ${
              isMobile 
                ? 'flex-col p-2 text-xs h-auto' 
                : ''
            }`}
          >
            <Package className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
            <span>المنتجات</span>
          </TabsTrigger>
          <TabsTrigger 
            value="accounting" 
            className={`flex items-center gap-2 ${
              isMobile 
                ? 'flex-col p-2 text-xs h-auto' 
                : ''
            }`}
          >
            <BarChart3 className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
            <span>الحسابات</span>
          </TabsTrigger>
          {!isMobile && (
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>العملاء</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Mobile: Show customers tab in a separate row */}
        {isMobile && (
          <TabsList className="grid w-full grid-cols-1 h-auto gap-1 p-1">
            <TabsTrigger 
              value="customers" 
              className="flex items-center gap-2 flex-col p-2 text-xs h-auto"
            >
              <Users className="h-4 w-4" />
              <span>العملاء</span>
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="accounting">
          <ImprovedAccountStatement />
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
