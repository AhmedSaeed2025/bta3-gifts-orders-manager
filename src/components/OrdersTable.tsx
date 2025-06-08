import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  DollarSign, 
  Search,
  Filter,
  List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const OrdersTable = () => {
  const { orders, deleteOrder, loading } = useSupabaseOrders();
  const { addTransaction } = useTransactions();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.phone.includes(searchTerm) ||
                         order.serial.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === "all" || order.status === statusFilter;
      const paymentMatch = paymentFilter === "all" || order.paymentMethod === paymentFilter;
      
      return searchMatch && statusMatch && paymentMatch;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const handleDelete = async (orderSerial: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      try {
        await deleteOrder(orderSerial);
        toast.success("تم حذف الطلب بنجاح");
      } catch (error) {
        toast.error("حدث خطأ أثناء حذف الطلب");
      }
    }
  };

  const handleCollectOrder = (order: any) => {
    const transaction = {
      transaction_type: "revenue",
      amount: order.total,
      description: `تحصيل طلب ${order.serial} - ${order.clientName}`,
      order_serial: order.serial
    };
    
    addTransaction(transaction);
    toast.success(`تم تسجيل تحصيل الطلب ${order.serial}`);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gift-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل الطلبات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <List className="h-5 w-5" />
          إدارة الطلبات ({filteredOrders.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث بالاسم أو الهاتف أو رقم الطلب"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">منتظر</SelectItem>
              <SelectItem value="confirmed">مؤكد</SelectItem>
              <SelectItem value="shipped">مشحون</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="فلترة بطريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع طرق الدفع</SelectItem>
              <SelectItem value="كاش">كاش</SelectItem>
              <SelectItem value="انستا باي">انستا باي</SelectItem>
              <SelectItem value="فودافون كاش">فودافون كاش</SelectItem>
              <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filteredOrders.length} من {orders.length} طلب
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {isMobile ? (
              // Mobile Card View
              <div className="space-y-3 p-4">
                {filteredOrders.map((order) => (
                  <Card key={order.serial} className="border-l-4 border-l-gift-primary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-sm">{order.serial}</h3>
                          <p className="text-sm text-gray-600">{truncateText(order.clientName, 20)}</p>
                          <p className="text-xs text-gray-500">{order.phone}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.serial}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              عرض
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/edit-order/${order.serial}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCollectOrder(order)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              تحصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(order.serial)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">الحالة:</span>
                          <Badge className={`mr-1 ${ORDER_STATUS_COLORS[order.status]}`}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-500">الإجمالي:</span>
                          <span className="font-bold text-gift-primary mr-1">
                            {formatCurrency(order.total)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">الدفع:</span>
                          <span className="mr-1">{order.paymentMethod}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">التاريخ:</span>
                          <span className="mr-1">
                            {new Date(order.dateCreated).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      
                      {order.address && (
                        <div className="mt-2 text-xs">
                          <span className="text-gray-500">العنوان:</span>
                          <span className="mr-1">{truncateText(order.address, 30)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop Table View
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      رقم الطلب
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الهاتف
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجمالي
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      طريقة الدفع
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العنوان
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.serial} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {order.serial}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {truncateText(order.clientName, 15)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {order.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={ORDER_STATUS_COLORS[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gift-primary">
                          {formatCurrency(order.total)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {order.paymentMethod}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(order.dateCreated).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {order.address ? truncateText(order.address, 20) : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/orders/${order.serial}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/edit-order/${order.serial}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              تعديل الطلب
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCollectOrder(order)}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              تسجيل تحصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(order.serial)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              حذف الطلب
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
