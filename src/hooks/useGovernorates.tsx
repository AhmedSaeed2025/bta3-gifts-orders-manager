import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { governorates as egyptianGovernorates } from '@/constants/adminSettings';

export interface GovernorateOption {
  id?: string;
  name: string;
  shipping_cost: number;
}

export const useGovernorates = () => {
  const { user } = useAuth();
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!user) {
      setGovernorates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('governorates')
        .select('id, name, shipping_cost, sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setGovernorates(data || []);
    } catch (error) {
      console.error('Error loading governorates:', error);
      setGovernorates([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Options used by forms: fall back to the Egyptian defaults until the user saves their own list
  const options: GovernorateOption[] = governorates.length > 0
    ? governorates
    : egyptianGovernorates.map((name) => ({ name, shipping_cost: 0 }));

  const addGovernorate = async (name: string, shippingCost: number) => {
    if (!user) return false;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('اكتب اسم المحافظة');
      return false;
    }
    if (governorates.some((g) => g.name === trimmed)) {
      toast.error('المحافظة موجودة بالفعل');
      return false;
    }
    try {
      const { error } = await supabase.from('governorates').insert({
        user_id: user.id,
        name: trimmed,
        shipping_cost: Number(shippingCost) || 0,
        sort_order: governorates.length,
      });
      if (error) throw error;
      toast.success('تم إضافة المحافظة');
      await fetchList();
      return true;
    } catch (error) {
      console.error('Error adding governorate:', error);
      toast.error('حدث خطأ أثناء إضافة المحافظة');
      return false;
    }
  };

  const updateGovernorate = async (id: string, patch: { name?: string; shipping_cost?: number }) => {
    try {
      const { error } = await supabase
        .from('governorates')
        .update(patch)
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
      toast.success('تم حفظ التعديل');
      await fetchList();
      return true;
    } catch (error) {
      console.error('Error updating governorate:', error);
      toast.error('حدث خطأ أثناء حفظ التعديل');
      return false;
    }
  };

  const removeGovernorate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('governorates')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);
      if (error) throw error;
      toast.success('تم حذف المحافظة');
      await fetchList();
      return true;
    } catch (error) {
      console.error('Error deleting governorate:', error);
      toast.error('حدث خطأ أثناء حذف المحافظة');
      return false;
    }
  };

  const moveGovernorate = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= governorates.length) return;
    const next = [...governorates];
    [next[index], next[target]] = [next[target], next[index]];
    setGovernorates(next);
    try {
      // Persist the new order for every row whose position changed
      const updates = next
        .map((g, i) => ({ id: g.id, sort_order: i }))
        .filter((u, i) => governorates[i]?.sort_order !== u.sort_order);
      await Promise.all(
        updates.map((u) =>
          supabase
            .from('governorates')
            .update({ sort_order: u.sort_order })
            .eq('id', u.id!)
            .eq('user_id', user!.id)
        )
      );
    } catch (error) {
      console.error('Error reordering governorates:', error);
      toast.error('حدث خطأ أثناء إعادة الترتيب');
      await fetchList();
    }
  };

  const seedEgyptianDefaults = async () => {
    if (!user) return;
    const existing = new Set(governorates.map((g) => g.name));
    const missing = egyptianGovernorates.filter((name) => !existing.has(name));
    if (missing.length === 0) {
      toast.info('كل المحافظات المصرية موجودة بالفعل');
      return;
    }
    try {
      const { error } = await supabase.from('governorates').insert(
        missing.map((name, i) => ({
          user_id: user.id,
          name,
          shipping_cost: 0,
          sort_order: governorates.length + i,
        }))
      );
      if (error) throw error;
      toast.success(`تم إضافة ${missing.length} محافظة`);
      await fetchList();
    } catch (error) {
      console.error('Error seeding governorates:', error);
      toast.error('حدث خطأ أثناء إضافة المحافظات');
    }
  };

  return {
    governorates,
    options,
    loading,
    refetch: fetchList,
    addGovernorate,
    updateGovernorate,
    removeGovernorate,
    moveGovernorate,
    seedEgyptianDefaults,
  };
};
