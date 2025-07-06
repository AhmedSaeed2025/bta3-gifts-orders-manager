
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
import { toast } from "sonner";

const EditOrder = () => {
  const { serial, id } = useParams<{ serial?: string; id?: string }>();
  const orderIdentifier = serial || id;
  const { getOrderBySerial, loading } = useSupabaseOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>();
  const [orderNotFound, setOrderNotFound] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!orderIdentifier) {
      console.log("EditOrder: No order identifier provided, redirecting to home");
      navigate("/");
      return;
    }

    if (!loading && !isInitialized) {
      console.log("EditOrder: Looking for order with identifier:", orderIdentifier);
      const foundOrder = getOrderBySerial(orderIdentifier);
      console.log("EditOrder: Found order:", foundOrder);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setOrderNotFound(false);
      } else {
        console.log("EditOrder: Order not found");
        setOrderNotFound(true);
        toast.error(`الطلب رقم ${orderIdentifier} غير موجود`);
      }
      setIsInitialized(true);
    }
  }, [orderIdentifier, getOrderBySerial, loading, navigate, isInitialized]);
  
  useEffect(() => {
    if (orderNotFound && isInitialized && !order) {
      console.log("EditOrder: Redirecting to home because order not found");
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [orderNotFound, isInitialized, order, navigate]);
  
  if (loading || !isInitialized) {
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
            الطلب رقم {orderIdentifier} غير موجود أو تم حذفه
          </p>
          <p className="text-gray-500 text-sm mb-4">
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
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
            >
              <ArrowRight size={16} />
              العودة للرئيسية
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
            >
              برنامج الحسابات
            </Button>
          </div>
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
