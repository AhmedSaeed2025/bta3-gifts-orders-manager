
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const AuthPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">تسجيل الدخول</h1>
            <p className="text-muted-foreground">
              سيتم إضافة واجهة تسجيل الدخول قريباً...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
