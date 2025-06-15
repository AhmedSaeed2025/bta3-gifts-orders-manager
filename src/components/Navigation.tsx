
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Store, Settings, Calculator, User } from 'lucide-react';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user is admin
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data?.role;
    },
    enabled: !!user
  });

  // Don't show navigation on admin or legacy-admin pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/legacy-admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
        <Link to="/">
          <Button 
            variant={location.pathname === '/' ? "default" : "ghost"} 
            size="sm"
            className="rounded-full"
          >
            <Store className="h-4 w-4 ml-1" />
            المتجر
          </Button>
        </Link>
        
        {user && userRole === 'admin' && (
          <>
            <Link to="/admin">
              <Button 
                variant={location.pathname.startsWith('/admin') ? "default" : "ghost"} 
                size="sm"
                className="rounded-full"
              >
                <Settings className="h-4 w-4 ml-1" />
                لوحة التحكم
              </Button>
            </Link>
            
            <Link to="/legacy-admin">
              <Button 
                variant={location.pathname === '/legacy-admin' ? "default" : "ghost"} 
                size="sm"
                className="rounded-full"
              >
                <Calculator className="h-4 w-4 ml-1" />
                برنامج الحسابات
              </Button>
            </Link>
          </>
        )}
        
        {!user && (
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full">
              <User className="h-4 w-4 ml-1" />
              تسجيل الدخول
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navigation;
