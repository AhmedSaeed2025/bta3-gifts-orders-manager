
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

const Logo = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-center md:text-right">
        <h1 className="text-2xl md:text-3xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">برنامج متابعة الطلبات</p>
      </div>
      <ThemeToggle />
    </div>
  );
};

export default Logo;
