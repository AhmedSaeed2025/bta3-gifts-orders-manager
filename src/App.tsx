
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import StorePage from "./pages/StorePage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import TermsPage from "./pages/TermsPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReports from "./pages/admin/AdminReports";

// Order Management
import OrderPage from "./pages/OrderPage";
import OrderDetails from "./pages/OrderDetails";
import EditOrder from "./pages/EditOrder";

// Contexts
import { OrderProvider } from "./context/OrderContext";
import { PriceProvider } from "./context/PriceContext";
import { ProductProvider } from "./context/ProductContext";
import { TransactionProvider } from "./context/TransactionContext";
import { ThemeProvider as ThemeContextProvider } from "./context/ThemeContext";
import { SupabaseOrderProvider } from "./context/SupabaseOrderContext";
import { AuthProvider } from "./hooks/useAuth";

import ErrorBoundary from "./components/ErrorBoundary";
import StoreReturnPolicy from "./components/store/ReturnPolicy";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <ThemeContextProvider>
            <TransactionProvider>
              <ProductProvider>
                <PriceProvider>
                  <OrderProvider>
                    <SupabaseOrderProvider>
                      <TooltipProvider>
                        <Toaster />
                        <BrowserRouter>
                          <ErrorBoundary>
                            <Routes>
                              {/* Public Routes */}
                              <Route path="/" element={<Index />} />
                              <Route path="/auth" element={<AuthPage />} />
                              
                              {/* Store Routes */}
                              <Route path="/store" element={<StorePage />} />
                              <Route path="/product/:id" element={<ProductPage />} />
                              <Route path="/cart" element={<CartPage />} />
                              <Route path="/checkout" element={<CheckoutPage />} />
                              <Route path="/order-confirmation/:serial" element={<OrderConfirmationPage />} />
                              <Route path="/track" element={<OrderTrackingPage />} />
                              <Route path="/track/:serial" element={<OrderTrackingPage />} />
                              <Route path="/about" element={<AboutPage />} />
                              <Route path="/contact" element={<ContactPage />} />
                              <Route path="/shipping" element={<ShippingPolicyPage />} />
                              <Route path="/terms" element={<TermsPage />} />
                              <Route path="/return-policy" element={<StoreReturnPolicy />} />
                              
                              {/* Admin Routes */}
                              <Route path="/admin" element={<AdminDashboard />} />
                              <Route path="/admin/products" element={<AdminProducts />} />
                              <Route path="/admin/orders" element={<AdminOrders />} />
                              <Route path="/admin/customers" element={<AdminCustomers />} />
                              <Route path="/admin/settings" element={<AdminSettings />} />
                              <Route path="/admin/reports" element={<AdminReports />} />
                              
                              {/* Order Management */}
                              <Route path="/order" element={<OrderPage />} />
                              <Route path="/order/:id" element={<OrderDetails />} />
                              <Route path="/order/:id/edit" element={<EditOrder />} />
                              
                              {/* Catch all */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </ErrorBoundary>
                        </BrowserRouter>
                      </TooltipProvider>
                    </SupabaseOrderProvider>
                  </OrderProvider>
                </PriceProvider>
              </ProductProvider>
            </TransactionProvider>
          </ThemeContextProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
