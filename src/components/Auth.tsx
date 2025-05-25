
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import Logo from './Logo';
import { Chrome } from 'lucide-react';

const Auth = () => {
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to sign in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            سجل دخولك لإدارة طلباتك ومنتجاتك
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
              variant="outline"
            >
              <Chrome className="h-5 w-5" />
              تسجيل الدخول بـ Google
            </Button>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>سيتم حفظ جميع بياناتك بشكل آمن</p>
              <p>ويمكنك الوصول إليها من أي جهاز</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
