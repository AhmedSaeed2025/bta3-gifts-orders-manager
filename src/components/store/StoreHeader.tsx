
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
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isMobile ? 'mobile-professional-header' : 'bg-background/95'}`}>
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
      <div className={`container mx-auto px-3 md:px-4 py-3 md:py-4 ${isMobile ? 'max-w-full' : ''}`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-3 ${isMobile ? 'flex-1 min-w-0' : ''}`}>
            {storeSettings?.logo_url ? (
              <img 
                src={storeSettings.logo_url} 
                alt={storeSettings.store_name || 'شعار المتجر'}
                className={`object-contain rounded-lg flex-shrink-0 ${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}
                onError={(e) => {
                  console.log('Logo failed to load, showing fallback');
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully');
                }}
              />
            ) : null}
            
            {/* Fallback logo */}
            <div 
              className={`rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${isMobile ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'}`}
              style={{ 
                backgroundColor: storeSettings?.primary_color || '#10B981',
                display: storeSettings?.logo_url ? 'none' : 'flex'
              }}
            >
              {storeSettings?.store_name?.charAt(0) || 'م'}
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 
                className={`font-bold leading-tight truncate ${isMobile ? 'text-sm' : 'text-xl'}`}
                style={{ color: storeSettings?.text_color || '#1F2937' }}
              >
                {storeSettings?.store_name || 'متجري'}
              </h1>
              {storeSettings?.store_tagline && (
                <p 
                  className={`text-xs leading-tight truncate ${isMobile ? 'text-xs' : 'text-sm'}`}
                  style={{ color: storeSettings?.secondary_color || '#059669' }}
                >
                  {storeSettings.store_tagline}
                </p>
              )}
            </div>
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
          <div className={`flex items-center flex-shrink-0 ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {!isMobile && (
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            )}
            
            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={isMobile ? 'mobile-professional-nav-button h-8 px-3' : ''}>
                    <User className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                    {isMobile && <span className="mr-1">حساب</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border mobile-professional-border z-50">
                  <DropdownMenuItem disabled className="mobile-professional-text">
                    مرحباً، {user.user_metadata?.full_name || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mobile-professional-border" />
                  
                  <Link to="/">
                    <DropdownMenuItem className="hover:mobile-professional-button">
                      <Store className="h-4 w-4 mr-2" />
                      المتجر
                    </DropdownMenuItem>
                  </Link>
                  
                  {userRole === 'admin' && (
                    <>
                      <Link to="/admin/dashboard">
                        <DropdownMenuItem className="hover:mobile-professional-button">
                          <Settings className="h-4 w-4 mr-2" />
                          لوحة التحكم
                        </DropdownMenuItem>
                      </Link>
                      
                      <Link to="/legacy-admin">
                        <DropdownMenuItem className="hover:mobile-professional-button">
                          <Calculator className="h-4 w-4 mr-2" />
                          برنامج الحسابات
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="mobile-professional-border" />
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
                <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={isMobile ? 'mobile-professional-nav-button h-8 px-3' : ''}>
                  <User className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                  {isMobile && <span className="mr-1">دخول</span>}
                </Button>
              </Link>
            )}
            
            <Link to="/cart">
              <Button variant="ghost" size={isMobile ? "sm" : "icon"} className={`relative ${isMobile ? 'mobile-professional-nav-button h-8 px-3' : ''}`}>
                <ShoppingCart className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                {isMobile && <span className="mr-1">سلة</span>}
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className={`absolute flex items-center justify-center p-0 text-xs ${isMobile ? '-top-1 -right-1 h-4 w-4 text-xs' : '-top-2 -right-2 h-5 w-5'}`}
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
                className="pl-10 mobile-professional-search h-9"
              />
            </div>
          </div>
        )}

        {/* Mobile top info */}
        {isMobile && (storeSettings?.contact_phone || storeSettings?.contact_email) && (
          <div className="mt-2 flex items-center justify-center gap-4 mobile-professional-small-text">
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
