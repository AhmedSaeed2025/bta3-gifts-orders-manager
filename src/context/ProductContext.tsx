
import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, ProductSize } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface ProductContextType {
  products: Product[];
  addProduct: (name: string) => void;
  updateProduct: (id: string, name: string) => void;
  deleteProduct: (id: string) => void;
  addProductSize: (productId: string, size: ProductSize) => void;
  updateProductSize: (productId: string, size: string, updatedSize: ProductSize) => void;
  deleteProductSize: (productId: string, size: string) => void;
  clearAllProducts: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Default product sizes
const DEFAULT_PRODUCT_SIZES: ProductSize[] = [
  { size: "مقاس افتراضي", cost: 100, price: 150 },
  { size: "100×60 سم", cost: 120, price: 180 }
];

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from local storage
  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Create a default product if none exists
      const defaultProduct: Product = {
        id: uuidv4(),
        name: "منتج افتراضي",
        sizes: DEFAULT_PRODUCT_SIZES
      };
      
      setProducts([defaultProduct]);
      localStorage.setItem("products", JSON.stringify([defaultProduct]));
    }
  }, []);

  // Save products to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const addProduct = (name: string) => {
    const newProduct: Product = {
      id: uuidv4(),
      name,
      sizes: DEFAULT_PRODUCT_SIZES // Add default sizes to new products
    };
    
    setProducts(prevProducts => [...prevProducts, newProduct]);
    toast.success("تم إضافة المنتج بنجاح");
  };

  const updateProduct = (id: string, name: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === id ? { ...product, name } : product
      )
    );
    toast.success("تم تحديث المنتج بنجاح");
  };

  const deleteProduct = (id: string) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
    toast.success("تم حذف المنتج بنجاح");
  };

  const addProductSize = (productId: string, size: ProductSize) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, sizes: [...product.sizes, size] } 
          : product
      )
    );
    toast.success("تم إضافة المقاس بنجاح");
  };

  const updateProductSize = (productId: string, sizeToUpdate: string, updatedSize: ProductSize) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? {
              ...product, 
              sizes: product.sizes.map(size => 
                size.size === sizeToUpdate ? updatedSize : size
              )
            } 
          : product
      )
    );
    toast.success("تم تحديث المقاس بنجاح");
  };

  const deleteProductSize = (productId: string, sizeToDelete: string) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? {
              ...product, 
              sizes: product.sizes.filter(size => size.size !== sizeToDelete)
            } 
          : product
      )
    );
    toast.success("تم حذف المقاس بنجاح");
  };

  const clearAllProducts = () => {
    // Create a default product
    const defaultProduct: Product = {
      id: uuidv4(),
      name: "منتج افتراضي",
      sizes: DEFAULT_PRODUCT_SIZES
    };
    
    setProducts([defaultProduct]);
    localStorage.setItem("products", JSON.stringify([defaultProduct]));
    toast.success("تم إعادة تعيين المنتجات");
  };

  return (
    <ProductContext.Provider 
      value={{ 
        products, 
        addProduct, 
        updateProduct, 
        deleteProduct, 
        addProductSize, 
        updateProductSize, 
        deleteProductSize,
        clearAllProducts
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
