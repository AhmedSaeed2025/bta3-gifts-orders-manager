
import React from "react";

const Logo = () => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        {/* Logo Image */}
        <div className="relative">
          <img 
            src="/lovable-uploads/f8e0b4b6-6b5a-4b25-b3d3-8e2c1f5a9d7e.png" 
            alt="#بتاع_هدايا_الأصلى Logo" 
            className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer rounded-lg shadow-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gift-primary/10 to-transparent rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Text Content */}
        <div className="text-center md:text-right">
          <h1 className="text-xl md:text-2xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">برنامج متابعة الطلبات</p>
        </div>
      </div>
    </div>
  );
};

export default Logo;
