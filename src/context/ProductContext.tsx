
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
  { size: "15*20 سم", cost: 120, price: 180 },
  { size: "20*30 سم", cost: 140, price: 200 },
  { size: "30*40 سم", cost: 180, price: 250 },
  { size: "40*50 سم", cost: 220, price: 300 },
  { size: "50*60 سم", cost: 280, price: 380 },
  { size: "50*70 سم", cost: 300, price: 400 },
  { size: "100*60 سم", cost: 350, price: 500 },
  { size: "160*60 سم", cost: 400, price: 600 },
  { size: "1 قطعة", cost: 60, price: 90 },
  { size: "2 قطعة", cost: 100, price: 150 },
  { size: "3 قطعة", cost: 140, price: 200 },
];

// Default products
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: uuidv4(),
    name: "تابلوه",
    sizes: DEFAULT_PRODUCT_SIZES.filter(size => size.size.includes("سم"))
  },
  {
    id: uuidv4(),
    name: "ماكيت مجسم",
    sizes: DEFAULT_PRODUCT_SIZES.filter(size => size.size.includes("سم"))
  },
  {
    id: uuidv4(),
    name: "ماكيت كاركتيري",
    sizes: DEFAULT_PRODUCT_SIZES.filter(size => size.size.includes("سم"))
  },
  {
    id: uuidv4(),
    name: "ميدالية مستطيله",
    sizes: DEFAULT_PRODUCT_SIZES.filter(size => size.size.includes("سم") || size.size.includes("قطعة"))
  },
  {
    id: uuidv4(),
    name: "ميدالية مجسمة",
    sizes: DEFAULT_PRODUCT_SIZES.filter(size => size.size.includes("سم") || size.size.includes("قطعة"))
  },
  {
    id: uuidv4(),
    name: "دلاية عربيه 1 قطعة",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "1 قطعة")!]
  },
  {
    id: uuidv4(),
    name: "دلاية عربيه 2 قطعة",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "2 قطعة")!]
  },
  {
    id: uuidv4(),
    name: "دلاية عربيه 3 قطعة",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "3 قطعة")!]
  },
  {
    id: uuidv4(),
    name: "مج عادى",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "مقاس افتراضي")!]
  },
  {
    id: uuidv4(),
    name: "مج سحري",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "مقاس افتراضي")!]
  },
  {
    id: uuidv4(),
    name: "تغليف هدايا",
    sizes: [DEFAULT_PRODUCT_SIZES.find(size => size.size === "مقاس افتراضي")!]
  },
];

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from local storage or use defaults
  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem("products", JSON.stringify(DEFAULT_PRODUCTS));
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
      sizes: [DEFAULT_PRODUCT_SIZES[0]] // Add default size to new products
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
    // Check if size with same name already exists
    const productToUpdate = products.find(p => p.id === productId);
    if (productToUpdate && productToUpdate.sizes.some(s => s.size === size.size)) {
      toast.error("هذا المقاس موجود بالفعل");
      return;
    }
    
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
    // Check if we're trying to rename to an existing size name
    if (sizeToUpdate !== updatedSize.size) {
      const productToUpdate = products.find(p => p.id === productId);
      if (productToUpdate && productToUpdate.sizes.some(s => s.size === updatedSize.size)) {
        toast.error("هذا المقاس موجود بالفعل");
        return;
      }
    }
    
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
    setProducts(DEFAULT_PRODUCTS);
    localStorage.setItem("products", JSON.stringify(DEFAULT_PRODUCTS));
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
