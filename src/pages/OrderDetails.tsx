
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import Logo from "@/components/Logo";
import Invoice from "@/components/Invoice";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const OrderDetails = () => {
  const { serial } = useParams<{ serial: string }>();
  const { getOrderBySerial } = useOrders();
  const navigate = useNavigate();
  
  const order = serial ? getOrderBySerial(serial) : undefined;
  
  useEffect(() => {
    if (!order) {
      navigate("/");
    }
  }, [order, navigate]);
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-4">جاري التحميل...</h2>
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
          <ThemeToggle />
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
