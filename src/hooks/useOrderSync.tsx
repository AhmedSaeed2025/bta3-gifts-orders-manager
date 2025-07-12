
import { useQueryClient } from '@tanstack/react-query';

export const useOrderSync = () => {
  const queryClient = useQueryClient();

  const syncOrders = () => {
    // Invalidate all order-related queries to ensure synchronization
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['products-management'] });
    queryClient.invalidateQueries({ queryKey: ['detailed-orders-report'] });
    queryClient.invalidateQueries({ queryKey: ['shipping-report'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['invoice-data'] });
  };

  return { syncOrders };
};
