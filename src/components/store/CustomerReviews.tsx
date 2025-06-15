
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerReviewsProps {
  storeSettings: any;
}

const CustomerReviews = ({ storeSettings }: CustomerReviewsProps) => {
  const isMobile = useIsMobile();

  const { data: reviews } = useQuery({
    queryKey: ['customer-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching customer reviews:', error);
        return [];
      }
      
      return data || [];
    }
  });

  // If no reviews or reviews disabled, don't show section
  if (!storeSettings?.customer_reviews_enabled || !reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className={`py-8 md:py-16 bg-gradient-to-r from-gray-50 to-white ${isMobile ? 'px-3' : 'px-4'}`}>
      <div className="container mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className={`font-bold text-gray-900 mb-4 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
            آراء عملائنا السعداء
          </h2>
          <p className={`text-gray-600 max-w-2xl mx-auto ${isMobile ? 'text-sm' : 'text-lg'}`}>
            استمع إلى تجارب عملائنا المميزة ومدى رضاهم عن منتجاتنا وخدماتنا
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex animate-scroll-horizontal space-x-6">
            {[...reviews, ...reviews].map((review, index) => (
              <div
                key={`${review.id}-${index}`}
                className={`flex-shrink-0 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 ${
                  isMobile ? 'w-72' : 'w-80'
                }`}
              >
                <div className="flex items-center mb-4">
                  <img
                    src={review.image_url}
                    alt={review.customer_name || 'عميل مجهول'}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    loading="lazy"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.customer_name || 'عميل مجهول'}</h4>
                    <div className="flex items-center">
                      {Array.from({ length: review.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    "{review.review_text}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
