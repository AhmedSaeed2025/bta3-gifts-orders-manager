import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { Order } from "@/types";
import Logo from "@/components/Logo";
import UserProfile from "@/components/UserProfile";
import OrderForm from "@/components/OrderForm";
import { ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ReorderPage = () => {
  const { serial } = useParams<{ serial: string }>();
  const { getOrderBySerial, loading } = useSupabaseOrders();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  const sourceOrder: Order | undefined = useMemo(() => {
    if (loading || !serial) return undefined;
    return getOrderBySerial(serial);
  }, [serial, loading, getOrderBySerial]);

  useEffect(() => {
    if (!loading && serial && !sourceOrder) {
      setNotFound(true);
      toast.error(`الطلب رقم ${serial} غير موجود`);
    }
  }, [loading, serial, sourceOrder]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <h2 className="text-lg font-bold mt-4">جاري تحميل بيانات الطلب...</h2>
        </div>
      </div>
    );
  }

  if (notFound || !sourceOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 space-y-4">
          <h2 className="text-xl font-bold">الطلب غير موجود</h2>
          <Button onClick={() => navigate("/legacy-admin")} variant="outline">
            العودة لبرنامج الحسابات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <UserProfile />
        </div>

        <div className="mb-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2 text-xs md:text-sm h-8 md:h-10"
          >
            <ArrowRight size={16} />
            رجوع
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <RefreshCw size={18} />
              إعادة طلب — {sourceOrder.clientName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderForm duplicateFrom={sourceOrder} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReorderPage;
