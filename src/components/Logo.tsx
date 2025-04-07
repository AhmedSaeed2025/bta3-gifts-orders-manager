
import React from "react";
import { Facebook } from "lucide-react";

const Logo = () => {
  return (
    <div className="text-center py-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gift-primary">#بتاع_هدايا_الأصلى</h1>
      <div className="mt-2 text-sm text-gray-600 flex justify-center items-center gap-4">
        <span>01113977005</span>
        <div className="flex items-center gap-1">
          <Facebook size={16} />
          <a href="https://www.facebook.com/D4Uofficial" className="hover:underline">D4Uofficial</a>
        </div>
      </div>
    </div>
  );
};

export default Logo;
