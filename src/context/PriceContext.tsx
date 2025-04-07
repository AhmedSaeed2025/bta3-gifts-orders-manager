
import React, { createContext, useContext, useState, useEffect } from "react";
import { ProposedPrices, ProposedPrice } from "@/types";
import { toast } from "sonner";

interface PriceContextType {
  proposedPrices: ProposedPrices;
  addProposedPrice: (productType: string, size: string, cost: number, price: number) => void;
  deleteProposedPrice: (productType: string, size: string) => void;
  getProposedPrice: (productType: string, size: string) => ProposedPrice | undefined;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export const PriceProvider = ({ children }: { children: React.ReactNode }) => {
  const [proposedPrices, setProposedPrices] = useState<ProposedPrices>({});

  // Load proposed prices from local storage
  useEffect(() => {
    const savedPrices = localStorage.getItem("proposedPrices");
    if (savedPrices) {
      setProposedPrices(JSON.parse(savedPrices));
    }
  }, []);

  // Save proposed prices to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("proposedPrices", JSON.stringify(proposedPrices));
  }, [proposedPrices]);

  const addProposedPrice = (productType: string, size: string, cost: number, price: number) => {
    setProposedPrices(prevPrices => {
      const updatedPrices = { ...prevPrices };
      
      if (!updatedPrices[productType]) {
        updatedPrices[productType] = {};
      }
      
      updatedPrices[productType][size] = { cost, price };
      
      return updatedPrices;
    });
    
    toast.success("تم حفظ السعر المقترح بنجاح");
  };

  const deleteProposedPrice = (productType: string, size: string) => {
    setProposedPrices(prevPrices => {
      const updatedPrices = { ...prevPrices };
      
      if (updatedPrices[productType] && updatedPrices[productType][size]) {
        delete updatedPrices[productType][size];
        
        // Remove product type if it has no more sizes
        if (Object.keys(updatedPrices[productType]).length === 0) {
          delete updatedPrices[productType];
        }
      }
      
      return updatedPrices;
    });
    
    toast.success("تم حذف السعر المقترح بنجاح");
  };

  const getProposedPrice = (productType: string, size: string): ProposedPrice | undefined => {
    if (proposedPrices[productType] && proposedPrices[productType][size]) {
      return proposedPrices[productType][size];
    }
    return undefined;
  };

  return (
    <PriceContext.Provider value={{ proposedPrices, addProposedPrice, deleteProposedPrice, getProposedPrice }}>
      {children}
    </PriceContext.Provider>
  );
};

export const usePrices = () => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error("usePrices must be used within a PriceProvider");
  }
  return context;
};
