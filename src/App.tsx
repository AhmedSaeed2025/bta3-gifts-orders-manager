
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import OrderDetails from './pages/OrderDetails';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"
import { SupabaseOrderProvider } from "@/context/SupabaseOrderContext";
import { TransactionProvider } from "@/context/TransactionContext";
import EditOrder from "@/pages/EditOrder";
import Auth from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Auth />;
  }

  return (
    <SupabaseOrderProvider>
      <TransactionProvider>
        <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/orders/:serial" element={<OrderDetails />} />
            <Route path="/edit-order/:serial" element={<EditOrder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </TransactionProvider>
    </SupabaseOrderProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
