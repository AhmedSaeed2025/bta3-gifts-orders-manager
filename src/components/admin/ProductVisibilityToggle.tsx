
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductVisibilityToggleProps {
  product: {
    id: string;
    name: string;
    is_active: boolean;
    category_id?: string;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  onUpdate: () => void;
}

const ProductVisibilityToggle = ({ product, categories, onUpdate }: ProductVisibilityToggleProps) => {
  const handleToggleVisibility = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(product.is_active ? 'تم إخفاء المنتج من المتجر' : 'تم إظهار المنتج في المتجر');
      onUpdate();
    } catch (error) {
      console.error('Error updating product visibility:', error);
      toast.error('حدث خطأ في تحديث حالة المنتج');
    }
  };

  const getCategoryName = () => {
    const category = categories.find(cat => cat.id === product.category_id);
    return category?.name || 'بدون فئة';
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {getCategoryName()}
      </Badge>
      
      <Button
        size="sm"
        variant={product.is_active ? "default" : "outline"}
        onClick={handleToggleVisibility}
        className="flex items-center gap-1"
      >
        {product.is_active ? (
          <>
            <Eye className="h-3 w-3" />
            ظاهر
          </>
        ) : (
          <>
            <EyeOff className="h-3 w-3" />
            مخفي
          </>
        )}
      </Button>
    </div>
  );
};

export default ProductVisibilityToggle;
