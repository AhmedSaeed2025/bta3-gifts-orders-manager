
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Search, User, Heart, LogOut, Store, Settings, Calculator, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
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
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isMobile ? 'mobile-warm-bg' : 'bg-background/95'}`}>
      {/* Top bar - مخفي على الموبايل */}
      {!isMobile && (
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
      )}

      {/* Main header */}
      <div className={`container mx-auto px-2 md:px-4 py-2 md:py-4 ${isMobile ? 'max-w-full' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-2 ${isMobile ? 'flex-1' : ''}`}>
            {storeSettings?.logo_url ? (
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings.store_name}
                className={`object-contain rounded ${isMobile ? 'h-8 w-auto' : 'h-10 w-auto'}`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const defaultLogo = e.currentTarget.nextElementSibling as HTMLElement;
                  if (defaultLogo) defaultLogo.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`rounded flex items-center justify-center text-white font-bold ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}
              style={{ 
                backgroundColor: storeSettings?.primary_color || '#10B981',
                display: storeSettings?.logo_url ? 'none' : 'flex'
              }}
            >
              {storeSettings?.store_name?.charAt(0) || 'م'}
            </div>
            <span className={`font-bold ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {isMobile ? (storeSettings?.store_name?.split(' ')[0] || 'متجري') : (storeSettings?.store_name || 'متجري')}
            </span>
          </Link>

          {/* Search bar - مخفي على الموبايل في الهيدر الرئيسي */}
          {!isMobile && (
            <div className="flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="ابحث عن المنتجات..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {!isMobile && (
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            )}
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={isMobile ? 'mobile-warm-button text-white' : ''}>
                    <User className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                    {isMobile && <span className="mr-1 text-xs">الحساب</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border mobile-warm-border z-50">
                  <DropdownMenuItem disabled className="mobile-warm-text">
                    مرحباً، {user.user_metadata?.full_name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mobile-warm-border" />
                  
                  <Link to="/">
                    <DropdownMenuItem className="hover:mobile-warm-button">
                      <Store className="h-4 w-4 mr-2" />
                      المتجر
                    </DropdownMenuItem>
                  </Link>
                  
                  {userRole === 'admin' && (
                    <>
                      <Link to="/admin/dashboard">
                        <DropdownMenuItem className="hover:mobile-warm-button">
                          <Settings className="h-4 w-4 mr-2" />
                          لوحة التحكم
                        </DropdownMenuItem>
                      </Link>
                      
                      <Link to="/legacy-admin">
                        <DropdownMenuItem className="hover:mobile-warm-button">
                          <Calculator className="h-4 w-4 mr-2" />
                          برنامج الحسابات
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="mobile-warm-border" />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50">
                    <LogOut className="h-4 w-4 mr-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={isMobile ? 'mobile-warm-button text-white' : ''}>
                  <User className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                  {isMobile && <span className="mr-1 text-xs">دخول</span>}
                </Button>
              </Link>
            )}
            
            <Link to="/cart">
              <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={`relative ${isMobile ? 'mobile-warm-button text-white' : ''}`}>
                <ShoppingCart className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                {isMobile && <span className="mr-1 text-xs">السلة</span>}
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className={`absolute flex items-center justify-center p-0 text-xs ${isMobile ? '-top-1 -right-1 h-4 w-4' : '-top-2 -right-2 h-5 w-5'}`}
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile search */}
        {isMobile && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="ابحث عن المنتجات..."
                className="pl-10 mobile-warm-border text-sm"
              />
            </div>
          </div>
        )}

        {/* Mobile top info */}
        {isMobile && (storeSettings?.contact_phone || storeSettings?.contact_email) && (
          <div className="mt-2 flex items-center justify-center gap-4 text-xs mobile-warm-text">
            {storeSettings?.contact_phone && (
              <span>📞 {storeSettings.contact_phone}</span>
            )}
            {storeSettings?.contact_email && (
              <span>✉️ {storeSettings.contact_email}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default StoreHeader;
