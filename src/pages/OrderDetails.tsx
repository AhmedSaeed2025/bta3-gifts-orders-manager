
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import Logo from "@/components/Logo";
import Invoice from "@/components/Invoice";
import UserProfile from "@/components/UserProfile";
import { ArrowRight } from "lucide-react";

const OrderDetails = () => {
  const { serial } = useParams<{ serial: string }>();
  const { getOrderBySerial, loading } = useSupabaseOrders();
  const navigate = useNavigate();
  
  const order = serial ? getOrderBySerial(serial) : undefined;
  
  useEffect(() => {
    if (!loading && !order) {
      navigate("/");
    }
  }, [order, navigate, loading]);
  
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
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">الطلب غير موجود</h2>
          <Button onClick={() => navigate("/")} variant="outline">العودة للرئيسية</Button>
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
            <CardTitle className="text-lg md:text-xl">تفاصيل الطلب - {order.serial}</CardTitle>
          </CardHeader>
          <CardContent>
            <Invoice order={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetails;
