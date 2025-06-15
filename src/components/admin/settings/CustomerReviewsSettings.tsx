import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Star, Image } from 'lucide-react';

interface CustomerReviewsSettingsProps {
  formData: any;
  onToggleChange: (field: string, value: boolean) => void;
}

const CustomerReviewsSettings = ({ formData, onToggleChange }: CustomerReviewsSettingsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newReview, setNewReview] = useState({
    image_url: '',
    review_text: '',
    customer_name: '',
    rating: 5
  });

  const { data: reviews } = useQuery({
    queryKey: ['customer-reviews-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof newReview) => {
      const { error } = await supabase
        .from('customer_reviews')
        .insert({
          user_id: user!.id,
          ...reviewData,
          sort_order: (reviews?.length || 0) + 1
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة المراجعة بنجاح');
      setNewReview({
        image_url: '',
        review_text: '',
        customer_name: '',
        rating: 5
      });
      queryClient.invalidateQueries({ queryKey: ['customer-reviews-admin'] });
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
    },
    onError: () => {
      toast.error('حدث خطأ في إضافة المراجعة');
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('customer_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف المراجعة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['customer-reviews-admin'] });
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
    },
    onError: () => {
      toast.error('حدث خطأ في حذف المراجعة');
    }
  });

  const toggleReviewMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ is_active: isActive })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-reviews-admin'] });
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
    }
  });

  const handleAddReview = () => {
    if (!newReview.image_url || !newReview.customer_name) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    addReviewMutation.mutate(newReview);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          إعدادات آراء العملاء
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Customer Reviews */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="customer_reviews_enabled" className="text-base font-medium">
              تفعيل قسم آراء العملاء
            </Label>
            <p className="text-sm text-muted-foreground">
              عرض قسم آراء العملاء في صفحة المتجر
            </p>
          </div>
          <Switch
            id="customer_reviews_enabled"
            checked={formData.customer_reviews_enabled}
            onCheckedChange={(checked) => onToggleChange('customer_reviews_enabled', checked)}
          />
        </div>

        {formData.customer_reviews_enabled && (
          <>
            {/* Add New Review */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <h3 className="font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة مراجعة جديدة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">اسم العميل *</Label>
                  <Input
                    id="customer_name"
                    value={newReview.customer_name}
                    onChange={(e) => setNewReview({ ...newReview, customer_name: e.target.value })}
                    placeholder="اسم العميل"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rating">التقييم</Label>
                  <select
                    id="rating"
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md"
                  >
                    {[5, 4, 3, 2, 1].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'نجمة' : 'نجوم'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="image_url">رابط صورة العميل *</Label>
                <Input
                  id="image_url"
                  value={newReview.image_url}
                  onChange={(e) => setNewReview({ ...newReview, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="review_text">نص المراجعة</Label>
                <Textarea
                  id="review_text"
                  value={newReview.review_text}
                  onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                  placeholder="ما يقوله العميل عن المنتج أو الخدمة..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAddReview}
                disabled={addReviewMutation.isPending}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة المراجعة
              </Button>
            </div>

            {/* Existing Reviews */}
            <div className="space-y-4">
              <h3 className="font-medium">المراجعات الحالية ({reviews?.length || 0})</h3>
              
              {reviews && reviews.length > 0 ? (
                <div className="grid gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <img
                            src={review.image_url}
                            alt={review.customer_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{review.customer_name}</h4>
                              <div className="flex">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                ))}
                              </div>
                              <Switch
                                checked={review.is_active}
                                onCheckedChange={(checked) => 
                                  toggleReviewMutation.mutate({ id: review.id, isActive: checked })
                                }
                                size="sm"
                              />
                            </div>
                            {review.review_text && (
                              <p className="text-sm text-gray-600">{review.review_text}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          disabled={deleteReviewMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد مراجعات بعد</p>
                  <p className="text-sm text-gray-400">أضف مراجعات العملاء لإظهارها في المتجر</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerReviewsSettings;
