
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
import { LogOut, User, RefreshCw, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user, signOut, syncAllData } = useAuth();
  const [syncing, setSyncing] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      await syncAllData();
      toast.success('تم مزامنة البيانات بنجاح');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('حدث خطأ أثناء المزامنة');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        products: JSON.parse(localStorage.getItem('products') || '[]'),
        proposedPrices: JSON.parse(localStorage.getItem('proposedPrices') || '{}'),
        exportDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('حدث خطأ أثناء تصدير البيانات');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (importedData.orders) {
            localStorage.setItem('orders', JSON.stringify(importedData.orders));
          }
          if (importedData.products) {
            localStorage.setItem('products', JSON.stringify(importedData.products));
          }
          if (importedData.proposedPrices) {
            localStorage.setItem('proposedPrices', JSON.stringify(importedData.proposedPrices));
          }
          
          toast.success('تم استيراد البيانات بنجاح، سيتم إعادة تحميل الصفحة');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Import failed:', error);
          toast.error('حدث خطأ أثناء استيراد البيانات، تأكد من صحة الملف');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const hasLocalData = () => {
    try {
      const localOrders = localStorage.getItem('orders');
      const localProducts = localStorage.getItem('products');
      const localProposedPrices = localStorage.getItem('proposedPrices');
      
      return (localOrders && JSON.parse(localOrders).length > 0) ||
             (localProducts && JSON.parse(localProducts).length > 0) ||
             (localProposedPrices && Object.keys(JSON.parse(localProposedPrices)).length > 0);
    } catch (error) {
      console.error('Error checking local data:', error);
      return false;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.user_metadata?.avatar_url} 
              alt="صورة المستخدم"
            />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="font-medium">
          {user.user_metadata?.full_name || user.email}
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
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          تصدير البيانات
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleImportData}>
          <Upload className="mr-2 h-4 w-4" />
          استيراد البيانات
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
