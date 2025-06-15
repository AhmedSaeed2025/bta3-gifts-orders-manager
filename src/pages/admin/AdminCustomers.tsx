
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminCustomers = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة العملاء</h1>
        <p className="text-muted-foreground">عرض وإدارة بيانات العملاء</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            سيتم إضافة واجهة إدارة العملاء قريباً...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
