
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSettings = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إعدادات المتجر</h1>
        <p className="text-muted-foreground">تخصيص وإدارة إعدادات متجرك</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإعدادات العامة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            سيتم إضافة واجهة الإعدادات قريباً...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
