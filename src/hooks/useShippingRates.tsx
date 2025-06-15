
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface ShippingRate {
  id?: string;
  product_type: string;
  product_size: string;
  governorate: string;
  shipping_cost: number;
}

export const useShippingRates = () => {
  const { user } = useAuth();
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [newShippingRate, setNewShippingRate] = useState<ShippingRate>({
    product_type: '',
    product_size: '',
    governorate: '',
    shipping_cost: 0
  });

  // Load shipping rates from localStorage on mount
  useEffect(() => {
    if (user) {
      try {
        const savedRates = localStorage.getItem(`shipping_rates_${user.id}`);
        if (savedRates) {
          const parsed = JSON.parse(savedRates);
          setShippingRates(parsed);
        }
      } catch (error) {
        console.error('Error loading shipping rates:', error);
        toast.error('حدث خطأ في تحميل أسعار الشحن');
      }
    }
  }, [user]);

  // Save shipping rates to localStorage whenever they change
  useEffect(() => {
    if (user && shippingRates.length >= 0) {
      try {
        localStorage.setItem(`shipping_rates_${user.id}`, JSON.stringify(shippingRates));
      } catch (error) {
        console.error('Error saving shipping rates:', error);
        toast.error('حدث خطأ في حفظ أسعار الشحن');
      }
    }
  }, [shippingRates, user]);

  const addShippingRate = () => {
    try {
      if (!newShippingRate.product_type || !newShippingRate.product_size || !newShippingRate.governorate) {
        toast.error('يرجى ملء جميع الحقول المطلوبة');
        return;
      }

      // Validate shipping cost
      const cost = Number(newShippingRate.shipping_cost);
      if (isNaN(cost) || cost < 0) {
        toast.error('يرجى إدخال تكلفة شحن صحيحة');
        return;
      }

      // Check for duplicates
      const exists = shippingRates.some(rate => 
        rate.product_type === newShippingRate.product_type &&
        rate.product_size === newShippingRate.product_size &&
        rate.governorate === newShippingRate.governorate
      );

      if (exists) {
        toast.error('هذه التكلفة موجودة بالفعل للمنتج والمقاس والمحافظة المحددة');
        return;
      }

      const rateWithId = { 
        ...newShippingRate, 
        id: Date.now().toString(),
        shipping_cost: cost
      };

      setShippingRates(prev => [...prev, rateWithId]);
      setNewShippingRate({
        product_type: '',
        product_size: '',
        governorate: '',
        shipping_cost: 0
      });
      toast.success('تم إضافة تكلفة الشحن بنجاح');
    } catch (error) {
      console.error('Error adding shipping rate:', error);
      toast.error('حدث خطأ في إضافة تكلفة الشحن');
    }
  };

  const removeShippingRate = (index: number) => {
    try {
      setShippingRates(prev => prev.filter((_, i) => i !== index));
      toast.success('تم حذف تكلفة الشحن بنجاح');
    } catch (error) {
      console.error('Error removing shipping rate:', error);
      toast.error('حدث خطأ في حذف تكلفة الشحن');
    }
  };

  const updateShippingRate = (index: number, updatedRate: ShippingRate) => {
    try {
      // Validate shipping cost
      const cost = Number(updatedRate.shipping_cost);
      if (isNaN(cost) || cost < 0) {
        toast.error('يرجى إدخال تكلفة شحن صحيحة');
        return;
      }

      const finalRate = {
        ...updatedRate,
        shipping_cost: cost
      };

      setShippingRates(prev => prev.map((rate, i) => i === index ? finalRate : rate));
      toast.success('تم تحديث تكلفة الشحن بنجاح');
    } catch (error) {
      console.error('Error updating shipping rate:', error);
      toast.error('حدث خطأ في تحديث تكلفة الشحن');
    }
  };

  return {
    shippingRates,
    setShippingRates,
    newShippingRate,
    setNewShippingRate,
    addShippingRate,
    removeShippingRate,
    updateShippingRate
  };
};
