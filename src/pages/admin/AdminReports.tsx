
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminReports = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground">تحليل أداء المتجر والمبيعات</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقارير المبيعات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            سيتم إضافة التقارير والإحصائيات قريباً...
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
