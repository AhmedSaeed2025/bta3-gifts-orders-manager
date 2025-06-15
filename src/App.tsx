import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";

// Store pages (customer-facing)
import StorePage from "@/pages/StorePage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderPage from "@/pages/OrderPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import ReturnPolicy from "@/components/store/ReturnPolicy";

// Admin pages
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminReports from "@/pages/admin/AdminReports";

// Auth pages
import AuthPage from "@/pages/AuthPage";

// Legacy admin (current system)
import Index from "@/pages/Index";

// Context providers
import { SupabaseOrderProvider } from "@/context/SupabaseOrderContext";
import { ProductProvider } from "@/context/ProductContext";
import { PriceProvider } from "@/context/PriceContext";
import { TransactionProvider } from "@/context/TransactionContext";

import "./App.css";
import Navigation from "@/components/Navigation";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <AuthProvider>
            <CartProvider>
              <Router>
                <div className="min-h-screen bg-background">
                  <Routes>
                    {/* Public Store Routes */}
                    <Route path="/" element={<StorePage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order" element={<OrderPage />} />
                    <Route path="/order-confirmation/:serial" element={<OrderConfirmationPage />} />
                    <Route path="/track/:serial" element={<OrderTrackingPage />} />
                    <Route path="/return-policy" element={<ReturnPolicy />} />
                    <Route path="/auth" element={<AuthPage />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="reports" element={<AdminReports />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    {/* Legacy Admin (current system) - wrapped with necessary providers */}
                    <Route 
                      path="/legacy-admin" 
                      element={
                        <SupabaseOrderProvider>
                          <ProductProvider>
                            <PriceProvider>
                              <TransactionProvider>
                                <Index />
                              </TransactionProvider>
                            </PriceProvider>
                          </ProductProvider>
                        </SupabaseOrderProvider>
                      } 
                    />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  
                  {/* Global Navigation */}
                  <Navigation />
                  <Toaster />
                </div>
              </Router>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
