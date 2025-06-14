
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('خطأ في التطبيق:', error, errorInfo);
    
    // عرض رسالة خطأ بسيطة للمستخدم
    toast.error('حدث خطأ مؤقت، جاري إعادة التحميل...');
    
    // إعادة تحميل الصفحة بعد ثانيتين
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
            <h2 className="text-xl font-bold mb-4 mt-4 text-gift-primary">جاري إعادة التحميل...</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
