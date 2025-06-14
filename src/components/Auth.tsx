
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setEmailLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast.success('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await signInWithEmail(email, password);
        toast.success('مرحباً بك! سيتم مزامنة بياناتك تلقائياً...');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.message?.includes('User already registered')) {
        toast.error('هذا البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول');
        setIsSignUp(false);
      } else {
        toast.error(isSignUp ? 'فشل في إنشاء الحساب' : 'فشل في تسجيل الدخول');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // التحقق من وجود بيانات محلية
  const hasLocalData = () => {
    const localOrders = localStorage.getItem('orders');
    const localProducts = localStorage.getItem('products');
    const localProposedPrices = localStorage.getItem('proposedPrices');
    
    return (localOrders && JSON.parse(localOrders).length > 0) ||
           (localProducts && JSON.parse(localProducts).length > 0) ||
           (localProposedPrices && Object.keys(JSON.parse(localProposedPrices)).length > 0);
  };

  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Professional Logo Section */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative group">
              <img 
                src="/lovable-uploads/3ea978cd-a7b5-462f-9fbc-a16ec6287700.png" 
                alt="#بتاع_هدايا_الأصلى Logo" 
                className="h-20 w-auto object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gift-primary/20 to-gift-secondary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl -z-10"></div>
            </div>
            
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gift-primary mb-2">#بتاع_هدايا_الأصلى</h1>
              <p className="text-gray-600 dark:text-gray-400">
                سجل دخولك لإدارة طلباتك ومنتجاتك
              </p>
            </div>
          </div>
          
          {hasLocalData() && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📱 تم العثور على بيانات محلية! سيتم مزامنتها تلقائياً عند تسجيل الدخول
              </p>
            </div>
          )}
        </div>
        
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">
              {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  required
                  disabled={emailLoading || loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    required
                    disabled={emailLoading || loading}
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={emailLoading || loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    disabled={emailLoading || loading}
                    minLength={6}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gift-primary to-gift-secondary hover:from-gift-primary/90 hover:to-gift-secondary/90"
                disabled={emailLoading || loading}
              >
                <Mail className="h-4 w-4" />
                {emailLoading ? 'جاري المعالجة...' : (isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول')}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                  setConfirmPassword('');
                }}
                disabled={emailLoading || loading}
                className="text-sm"
              >
                {isSignUp 
                  ? 'لديك حساب بالفعل؟ سجل الدخول' 
                  : 'ليس لديك حساب؟ أنشئ حساباً جديداً'
                }
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>سيتم حفظ جميع بياناتك بشكل آمن</p>
              <p>ومزامنتها تلقائياً مع قاعدة البيانات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
