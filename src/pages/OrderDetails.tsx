
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/context/OrderContext";
import Logo from "@/components/Logo";
import Invoice from "@/components/Invoice";

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
    return <div>جاري التحميل...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gift-accent">
      <div className="container mx-auto px-4 py-6">
        <Logo />
        
        <div className="mb-4 mt-6">
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
          >
            العودة للرئيسية
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">تفاصيل الطلب - {order.serial}</CardTitle>
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
