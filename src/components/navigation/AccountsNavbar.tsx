
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const AccountsNavbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Fetch store settings to check if store is enabled
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings-visibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('is_active')
        .eq('user_id', user!.id)
        .single();
      
      if (error && error.code !== 'PGRST116') return { is_active: true };
      return data || { is_active: true };
    },
    enabled: !!user
  });

  const isStoreEnabled = storeSettings?.is_active !== false;

  const navLinks = [
    ...(isStoreEnabled ? [{ to: "/store", label: "المتجر" }] : []),
    { to: "/admin/dashboard", label: "لوحة التحكم" },
    { to: "/legacy-admin", label: "برنامج الحسابات" },
    { to: "/admin/finance", label: "الإدارة المالية" },
  ];

  return (
    <nav className={`w-full bg-white border-b mb-4 md:mb-6 shadow-sm ${isMobile ? 'mobile-warm-bg' : ''}`}>
      <div className={`max-w-7xl mx-auto px-2 md:px-4 flex items-center ${isMobile ? 'flex-col gap-2 py-2' : 'gap-2 h-14'}`}>
        {navLinks.map((link) => {
          const isActive =
            link.to === "/legacy-admin"
              ? location.pathname.startsWith("/legacy-admin")
              : link.to === "/admin/finance"
              ? location.pathname === "/admin/finance"
              : link.to === "/admin/dashboard"
              ? location.pathname.startsWith("/admin") && location.pathname !== "/admin/finance"
              : location.pathname === link.to || (link.to === "/store" && location.pathname === "/");
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`${isMobile ? 'w-full text-center' : ''} px-3 md:px-4 py-2 rounded transition-all font-medium text-sm md:text-base ${
                isActive
                  ? `${isMobile ? 'mobile-warm-button' : 'bg-primary'} text-white shadow-md`
                  : `text-gray-700 hover:bg-gray-100 ${isMobile ? 'mobile-warm-border border' : ''}`
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AccountsNavbar;
