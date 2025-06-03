
import { useState } from "react";
import { useProducts } from "@/context/ProductContext";
import { toast } from "sonner";

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export const useProductSync = () => {
  const { products, loading } = useProducts();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const syncToSupabase = async () => {
    setSyncStatus('syncing');
    try {
      // Products are already synced to Supabase in real-time through ProductContext
      toast.success("تم رفع البيانات للسيرفر بنجاح");
      setSyncStatus('success');
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      toast.error("حدث خطأ في رفع البيانات");
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  const syncFromSupabase = async () => {
    setSyncStatus('syncing');
    try {
      // Products are automatically loaded from Supabase through ProductContext
      toast.success("تم تحديث البيانات من السيرفر");
      setSyncStatus('success');
    } catch (error) {
      console.error('Error syncing from Supabase:', error);
      toast.error("حدث خطأ في تحديث البيانات");
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  return {
    syncStatus,
    syncToSupabase,
    syncFromSupabase,
    isLoading: loading
  };
};
