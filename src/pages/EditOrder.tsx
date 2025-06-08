
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
      console.log("EditOrder: Looking for order with serial:", serial);
      const foundOrder = getOrderBySerial(serial);
      console.log("EditOrder: Found order:", foundOrder);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setOrderNotFound(false);
      } else {
        console.log("EditOrder: Order not found, setting orderNotFound to true");
        setOrderNotFound(true);
      }
    }
  }, [serial, getOrderBySerial, loading]);
  
  // Don't redirect immediately when order is not found during loading
  useEffect(() => {
    if (orderNotFound && !loading && !order) {
      console.log("EditOrder: Redirecting to home because order not found");
      const timer = setTimeout(() => {
        navigate("/");
      }, 2000); // Give 2 seconds delay before redirecting
      
      return () => clearTimeout(timer);
    }
  }, [orderNotFound, loading, order, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }
  
  if (orderNotFound && !order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">الطلب غير موجود</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            سيتم إعادة توجيهك للصفحة الرئيسية خلال ثوانٍ...
          </p>
          <Button onClick={() => navigate("/")} variant="outline">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري البحث عن الطلب...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gift-accent dark:bg-gray-900 transition-colors duration-300">
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
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">تعديل الطلب - {order.serial}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderForm editingOrder={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditOrder;
