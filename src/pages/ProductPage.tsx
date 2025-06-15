
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const ProductPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">صفحة المنتج</h1>
              <p className="text-muted-foreground">
                سيتم إضافة تفاصيل المنتج {id} قريباً...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductPage;
