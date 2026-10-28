import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Shared store settings for invoice rendering (logo, brand colors, contact data...).
 * Mirrors the query used by the invoices tab so every invoice view renders identically.
 */
export const useStoreSettings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['store-settings-invoice', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      return data;
    },
    enabled: !!user,
  });
};
