import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  BarChart3,
  LogOut,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  // Check if user is admin
  const { data: userRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role;
    },
    enabled: !!user
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { 
      title: 'لوحة التحكم', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      title: 'المنتجات', 
      href: '/admin/products', 
      icon: Package 
    },
    { 
      title: 'الطلبات', 
      href: '/admin/orders', 
      icon: ShoppingCart 
    },
    { 
      title: 'العملاء', 
      href: '/admin/customers', 
      icon: Users 
    },
    { 
      title: 'التقارير', 
      href: '/admin/reports', 
      icon: BarChart3 
    },
    { 
      title: 'الإعدادات', 
      href: '/admin/settings', 
      icon: Settings 
    }
  ];

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">لوحة تحكم الأدمن</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user.email}
          </p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
          
          <div className="mt-4 pt-4 border-t">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← العودة للمتجر
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
