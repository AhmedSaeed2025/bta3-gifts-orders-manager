
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, RefreshCw, Trash2 } from 'lucide-react';

const UserProfile = () => {
  const { user, signOut, syncAllData, clearLocalData } = useAuth();
  const [syncing, setSyncing] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncAllData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearLocal = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات المحلية؟ لا يمكن التراجع عن هذا الإجراء.')) {
      clearLocalData();
    }
  };

  // التحقق من وجود بيانات محلية
  const hasLocalData = () => {
    const localOrders = localStorage.getItem('orders');
    const localProducts = localStorage.getItem('products');
    const localProposedPrices = localStorage.getItem('proposedPrices');
    
    return (localOrders && JSON.parse(localOrders).length > 0) ||
           (localProducts && JSON.parse(localProducts).length > 0) ||
           (localProposedPrices && Object.keys(JSON.parse(localProposedPrices)).length > 0);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata.avatar_url} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="font-medium">
          {user.user_metadata.full_name || user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        {hasLocalData() && (
          <>
            <DropdownMenuItem onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {syncing ? 'جاري المزامنة...' : 'مزامنة البيانات'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClearLocal} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              حذف البيانات المحلية
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
