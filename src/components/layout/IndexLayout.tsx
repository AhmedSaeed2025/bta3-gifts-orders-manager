
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import AccountsNavbar from "@/components/navigation/AccountsNavbar";
import IndexTabs from "@/components/tabs/IndexTabs";

const IndexLayout = () => {
  const isMobile = useIsMobile();

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
