import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { OrderStatus, OrderStatusConfig } from '@/types';

export interface OrderStatusOption {
  value: string;
  label: string;
  color: string;
  enabled: boolean;
}

const defaultStatusConfigs: OrderStatusConfig[] = [
  { status: 'pending', label: 'قيد المراجعة', order: 1, enabled: true },
  { status: 'confirmed', label: 'تم التأكيد', order: 2, enabled: true },
  { status: 'processing', label: 'قيد التحضير', order: 3, enabled: true },
  { status: 'sentToPrinter', label: 'تم الإرسال للمطبعة', order: 4, enabled: true },
  { status: 'readyForDelivery', label: 'تحت التسليم', order: 5, enabled: true },
  { status: 'shipped', label: 'تم الشحن', order: 6, enabled: true },
  { status: 'delivered', label: 'تم التوصيل', order: 7, enabled: true },
  { status: 'cancelled', label: 'ملغي', order: 8, enabled: true }
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  sentToPrinter: 'bg-orange-100 text-orange-800 border-orange-200',
  sent_to_printing: 'bg-orange-100 text-orange-800 border-orange-200',
  readyForDelivery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  printing_received: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  returned: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const useOrderStatuses = () => {
  const { user } = useAuth();
  const [statusConfigs, setStatusConfigs] = useState<OrderStatusConfig[]>(defaultStatusConfigs);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfigurations = () => {
      try {
        const savedConfigs = user ? localStorage.getItem(`order_status_configs_${user.id}`) : null;
        
        if (savedConfigs) {
          const parsed = JSON.parse(savedConfigs);
          setStatusConfigs(parsed);
        } else {
          setStatusConfigs(defaultStatusConfigs);
        }
      } catch (error) {
        console.error('Error loading status configurations:', error);
        setStatusConfigs(defaultStatusConfigs);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, [user]);

  // Get all enabled statuses as options for dropdowns
  const getStatusOptions = (): OrderStatusOption[] => {
    return statusConfigs
      .filter(config => config.enabled)
      .sort((a, b) => a.order - b.order)
      .map(config => ({
        value: config.status,
        label: config.label,
        color: statusColors[config.status] || 'bg-gray-100 text-gray-800',
        enabled: config.enabled
      }));
  };

  // Get label for a status value
  const getStatusLabel = (status: string): string => {
    const config = statusConfigs.find(c => c.status === status);
    return config?.label || status;
  };

  // Get color for a status value
  const getStatusColor = (status: string): string => {
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // Check if a status is enabled
  const isStatusEnabled = (status: string): boolean => {
    const config = statusConfigs.find(c => c.status === status);
    return config?.enabled ?? false;
  };

  return {
    statusConfigs,
    isLoading,
    getStatusOptions,
    getStatusLabel,
    getStatusColor,
    isStatusEnabled
  };
};
