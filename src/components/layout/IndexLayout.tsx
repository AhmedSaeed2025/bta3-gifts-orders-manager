import React from "react";
import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import AccountsNavbar from "@/components/navigation/AccountsNavbar";
import IndexTabs from "@/components/tabs/IndexTabs";
import { Loader2 } from "lucide-react";

const IndexLayout = () => {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={`${isMobile ? 'mobile-warm-bg' : ''}`}>
      <AccountsNavbar />
      <div className={`min-h-screen transition-colors duration-300 ${isMobile ? 'mobile-warm-bg' : 'bg-gift-accent dark:bg-gray-900'}`} dir="rtl">
        <div className={`container mx-auto px-2 md:px-4 py-2 md:py-6 ${isMobile ? 'max-w-full' : ''}`} dir="rtl">
          <div className={`flex items-center justify-between mb-3 md:mb-4 ${isMobile ? 'px-2' : ''}`} dir="rtl">
            <Logo />
            <UserProfile />
          </div>
          
          <IndexTabs />
        </div>
      </div>
    </div>
  );
};

export default IndexLayout;
