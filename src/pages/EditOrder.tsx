
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { Order } from "@/types";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import OrderForm from "@/components/OrderForm";
import { ArrowRight, AlertCircle, Edit } from "lucide-react";

const EditOrder = () => {
  const { serial } = useParams<{ serial: string }>();
  const { getOrderBySerial, loading } = useSupabaseOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>();
  const [orderNotFound, setOrderNotFound] = useState(false);
  
  useEffect(() => {
    if (serial && !loading) {
      console.log('البحث عن الطلب بالرقم:', serial);
      const foundOrder = getOrderBySerial(serial);
      console.log('الطلب الموجود:', foundOrder);
      
      if (foundOrder) {
        setOrder(foundOrder);
        setOrderNotFound(false);
      } else {
        console.log('الطلب غير موجود');
        setOrderNotFound(true);
      }
    }
  }, [serial, getOrderBySerial, loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gift-accent dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gift-primary mx-auto"></div>
          <h2 className="text-xl font-bold mb-4 mt-4">جاري تحميل بيانات الطلب...</h2>
          <p className="text-gray-600">يرجى الانتظار</p>
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
          
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center p-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4 text-red-600">الطلب غير موجود</h2>
              <p className="text-gray-600 mb-6">
                لم يتم العثور على الطلب رقم: <span className="font-bold">{serial}</span>
              </p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/")} className="w-full">
                  العودة للرئيسية
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  عرض جميع الطلبات
                </Button>
              </div>
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
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
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
        
        <div className="mb-4">
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <Edit className="h-5 w-5" />
                تعديل الطلب: {order.serial}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">العميل: </span>
                  <span className="font-semibold">{order.clientName}</span>
                </div>
                <div>
                  <span className="text-gray-600">الهاتف: </span>
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة: </span>
                  <span className="font-semibold">{order.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">التاريخ: </span>
                  <span className="font-semibold">{new Date(order.dateCreated).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <OrderForm editingOrder={order} />
      </div>
    </div>
  );
};

export default EditOrder;
