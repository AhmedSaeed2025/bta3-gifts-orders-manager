
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

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
