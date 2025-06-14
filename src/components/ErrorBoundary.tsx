
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('خطأ في التطبيق:', error, errorInfo);
    
    if (this.state.retryCount < this.maxRetries) {
      toast.error('حدث خطأ مؤقت، جاري المحاولة مرة أخرى...');
      
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000);
    } else {
      toast.error('حدث خطأ مستمر، جاري إعادة تحميل الصفحة...');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
            <h2 className="text-xl font-bold mb-4 mt-4 text-gift-primary">
              {this.state.retryCount < this.maxRetries ? 'جاري المحاولة مرة أخرى...' : 'جاري إعادة التحميل...'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {this.state.retryCount < this.maxRetries 
                ? `المحاولة ${this.state.retryCount + 1} من ${this.maxRetries}` 
                : 'يرجى الانتظار قليلاً'
              }
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
