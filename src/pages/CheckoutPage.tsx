
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">إتمام الطلب</h1>
              <p className="text-muted-foreground">
                سيتم إضافة واجهة إتمام الطلب قريباً...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CheckoutPage;
