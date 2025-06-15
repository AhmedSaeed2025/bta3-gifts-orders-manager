
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminOrders = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
        <p className="text-muted-foreground">تتبع وإدارة جميع طلبات العملاء</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            سيتم إضافة واجهة إدارة الطلبات قريباً...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrders;
