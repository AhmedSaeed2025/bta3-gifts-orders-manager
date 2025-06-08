
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { Order } from "@/types";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import OrderForm from "@/components/OrderForm";
import { ArrowRight } from "lucide-react";

const EditOrder = () => {
  const { serial } = useParams<{ serial: string }>();
  const { getOrderBySerial, loading } = useSupabaseOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>();
  const [orderNotFound, setOrderNotFound] = useState(false);
  
  useEffect(() => {
    if (serial && !loading) {
      console.log('Looking for order with serial:', serial);
      const foundOrder = getOrderBySerial(serial);
      console.log('Found order:', foundOrder);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setOrderNotFound(false);
      } else {
        console.log('Order not found, setting orderNotFound to true');
        setOrderNotFound(true);
      }
    }
  }, [serial, getOrderBySerial, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }
  
  if (orderNotFound) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300" dir="rtl">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <Logo />
            <UserProfile />
          </div>
          
          <div className="mb-4">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
            >
              <ArrowRight size={16} />
              العودة للرئيسية
            </Button>
          </div>
          
          <Card>
            <CardContent className="text-center p-8">
              <h2 className="text-xl font-bold mb-4">الطلب غير موجود</h2>
              <p className="text-gray-600 mb-4">لم يتم العثور على الطلب رقم: {serial}</p>
              <Button onClick={() => navigate("/")} variant="outline">العودة للرئيسية</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300" dir="rtl">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>
        
        <div className="mb-4">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
          >
            <ArrowRight size={16} />
            العودة للرئيسية
          </Button>
        </div>
        
        <OrderForm editingOrder={order} />
      </div>
    </div>
  );
};

export default EditOrder;
