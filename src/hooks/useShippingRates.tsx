
import { useState } from 'react';
import { toast } from 'sonner';

export interface ShippingRate {
  id?: string;
  product_type: string;
  product_size: string;
  governorate: string;
  shipping_cost: number;
}

export const useShippingRates = () => {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [newShippingRate, setNewShippingRate] = useState<ShippingRate>({
    product_type: '',
    product_size: '',
    governorate: '',
    shipping_cost: 0
  });

  const addShippingRate = () => {
    if (!newShippingRate.product_type || !newShippingRate.product_size || !newShippingRate.governorate) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setShippingRates(prev => [...prev, { ...newShippingRate, id: Date.now().toString() }]);
    setNewShippingRate({
      product_type: '',
      product_size: '',
      governorate: '',
      shipping_cost: 0
    });
    toast.success('تم إضافة تكلفة الشحن');
  };

  const removeShippingRate = (index: number) => {
    setShippingRates(prev => prev.filter((_, i) => i !== index));
    toast.success('تم حذف تكلفة الشحن');
  };

  return {
    shippingRates,
    setShippingRates,
    newShippingRate,
    setNewShippingRate,
    addShippingRate,
    removeShippingRate
  };
};
