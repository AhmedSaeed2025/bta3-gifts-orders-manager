
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Store } from 'lucide-react';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();

  // التأكد من إذا كان المستخدم أدمن
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
    enabled: !!user,
  });

  // إخفاء النافيجيشن في صفحات لوحة التحكم والبرنامج الحسابي
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/legacy-admin')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
        <Link to="/">
          <Button
            variant={location.pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full"
          >
            <Store className="h-4 w-4 ml-1" />
            المتجر
          </Button>
        </Link>

        {/* لو لم يكن هناك مستخدم (غير مسجل دخول) */}
        {!user && (
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full">
              تسجيل الدخول
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Navigation;
