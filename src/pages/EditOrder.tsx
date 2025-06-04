
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
  
  useEffect(() => {
    if (serial) {
      const foundOrder = getOrderBySerial(serial);
      setOrder(foundOrder);
      
      if (!loading && !foundOrder) {
        navigate("/");
      }
    }
  }, [serial, getOrderBySerial, navigate, loading]);
  
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
            <CardTitle className="text-lg md:text-xl">تعديل الطلب - {order.serial}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">بيانات الطلب الحالي:</h3>
              <p><strong>العميل:</strong> {order.clientName}</p>
              <p><strong>رقم التليفون:</strong> {order.phone}</p>
              <p><strong>العنوان:</strong> {order.address}</p>
              <p><strong>إجمالي الطلب:</strong> {order.total} جنيه</p>
            </div>
            <div className="text-center text-gray-600">
              <p>لتعديل الطلب، يرجى إنشاء طلب جديد وحذف الطلب الحالي من إدارة الطلبات</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditOrder;
