
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, User, Heart, LogOut, Store, Settings, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StoreHeaderProps {
  storeSettings: any;
}

const StoreHeader = ({ storeSettings }: StoreHeaderProps) => {
  const { cartItems } = useCart();
  const { user, signOut } = useAuth();
  const cartItemsCount = cartItems?.length || 0;

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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span>📞 {storeSettings?.contact_phone || 'اتصل بنا'}</span>
              <span>✉️ {storeSettings?.contact_email || 'info@store.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/track" className="hover:text-primary">
                تتبع طلبك
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {storeSettings?.logo_url ? (
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings.store_name}
                className="h-10 w-auto object-contain rounded"
                onError={(e) => {
                  // في حالة فشل تحميل الصورة، إخفاؤها وإظهار اللوجو الافتراضي
                  e.currentTarget.style.display = 'none';
                  const defaultLogo = e.currentTarget.nextElementSibling as HTMLElement;
                  if (defaultLogo) defaultLogo.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="h-10 w-10 rounded flex items-center justify-center text-white font-bold"
              style={{ 
                backgroundColor: storeSettings?.primary_color || '#10B981',
                display: storeSettings?.logo_url ? 'none' : 'flex'
              }}
            >
              {storeSettings?.store_name?.charAt(0) || 'م'}
            </div>
            <span className="text-xl font-bold">
              {storeSettings?.store_name || 'متجري'}
            </span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="ابحث عن المنتجات..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    مرحباً، {user.user_metadata?.full_name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  
                  <Link to="/">
                    <DropdownMenuItem>
                      <Store className="h-4 w-4 mr-2" />
                      المتجر
                    </DropdownMenuItem>
                  </Link>
                  
                  {/* يظهر للأدمن فقط */}
                  {userRole === 'admin' && (
                    <>
                      <Link to="/admin/dashboard">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          لوحة التحكم
                        </DropdownMenuItem>
                      </Link>
                      
                      <Link to="/legacy-admin">
                        <DropdownMenuItem>
                          <Calculator className="h-4 w-4 mr-2" />
                          برنامج الحسابات
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="ابحث عن المنتجات..."
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
