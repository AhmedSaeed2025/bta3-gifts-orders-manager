
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Truck,
  Package,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Filter,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const ImprovedShippingReport = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch orders with shipping info
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['shipping-orders', selectedPeriod],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data, error } = await supabase
        .from('admin_orders')
        .select(`
          *,
          admin_order_items (*)
        `)
        .eq('user_id', user!.id)
        .gte('order_date', daysAgo.toISOString())
        .order('order_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.serial.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesGovernorate = governorateFilter === 'all' || order.governorate === governorateFilter;
      
      return matchesSearch && matchesStatus && matchesGovernorate;
    });
  }, [orders, searchTerm, statusFilter, governorateFilter]);

  // Calculate shipping statistics
  const shippingStats = useMemo(() => {
    const stats = {
      totalOrders: filteredOrders.length,
      pendingShipment: 0,
      shipped: 0,
      delivered: 0,
      totalShippingRevenue: 0,
      governorateStats: new Map<string, { orders: number; shippingRevenue: number; pending: number; delivered: number }>(),
      avgShippingCost: 0
    };

    filteredOrders.forEach(order => {
      stats.totalShippingRevenue += order.shipping_cost || 0;
      
      // Status counts
      switch (order.status) {
        case 'pending':
        case 'confirmed':
        case 'processing':
          stats.pendingShipment++;
          break;
        case 'shipped':
          stats.shipped++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
      }

      // Governorate stats
      if (order.governorate) {
        const govStats = stats.governorateStats.get(order.governorate) || {
          orders: 0,
          shippingRevenue: 0,
          pending: 0,
          delivered: 0
        };
        
        govStats.orders++;
        govStats.shippingRevenue += order.shipping_cost || 0;
        
        if (['pending', 'confirmed', 'processing'].includes(order.status)) {
          govStats.pending++;
        } else if (order.status === 'delivered') {
          govStats.delivered++;
        }
        
        stats.governorateStats.set(order.governorate, govStats);
      }
    });

    stats.avgShippingCost = stats.totalOrders > 0 ? stats.totalShippingRevenue / stats.totalOrders : 0;

    return stats;
  }, [filteredOrders]);

  // Get unique governorates for filter
  const availableGovernorates = useMemo(() => {
    const govs = new Set<string>();
    orders.forEach(order => {
      if (order.governorate) govs.add(order.governorate);
    });
    return Array.from(govs).sort();
  }, [orders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'قيد المراجعة',
      'confirmed': 'تم التأكيد',
      'processing': 'قيد التحضير',
      'shipped': 'تم الشحن',
      'delivered': 'تم التوصيل',
      'cancelled': 'ملغي'
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">جاري تحميل بيانات الشحن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" dir="rtl">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">تقرير الشحن المطور</CardTitle>
              <p className="text-muted-foreground text-sm">إدارة وتتبع جميع عمليات الشحن والتوصيل</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">إجمالي الطلبات</p>
                <p className="text-xl font-bold text-blue-900">{shippingStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700">في الانتظار</p>
                <p className="text-xl font-bold text-orange-900">{shippingStats.pendingShipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-sm text-purple-700">تم الشحن</p>
                <p className="text-xl font-bold text-purple-900">{shippingStats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-green-700">تم التوصيل</p>
                <p className="text-xl font-bold text-green-900">{shippingStats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700">إجمالي إيرادات الشحن</p>
              <p className="text-3xl font-bold text-emerald-900">{formatCurrency(shippingStats.totalShippingRevenue)}</p>
              <p className="text-sm text-emerald-600 mt-1">
                متوسط تكلفة الشحن: {formatCurrency(shippingStats.avgShippingCost)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <span className="font-medium">البحث والفلترة</span>
          </div>
          
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو الهاتف أو رقم الطلب"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد المراجعة</SelectItem>
                <SelectItem value="confirmed">تم التأكيد</SelectItem>
                <SelectItem value="processing">قيد التحضير</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التوصيل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={governorateFilter} onValueChange={setGovernorateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المحافظات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحافظات</SelectItem>
                {availableGovernorates.map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">آخر 7 أيام</SelectItem>
                <SelectItem value="30">آخر 30 يوماً</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
                <SelectItem value="365">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || statusFilter !== 'all' || governorateFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setGovernorateFilter('all');
              }}
              className="mt-3"
            >
              مسح الفلاتر
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              قائمة الطلبات ({filteredOrders.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد طلبات مطابقة للفلاتر المحددة
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border">
                  <CardContent className="p-4">
                    <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                      <div className={`${isMobile ? 'space-y-2' : 'flex items-center gap-4'}`}>
                        <div>
                          <div className="font-bold text-lg">{order.serial}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {order.customer_name}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span dir="ltr">{order.customer_phone}</span>
                        </div>
                        
                        {order.governorate && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {order.governorate}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(order.order_date).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      
                      <div className={`${isMobile ? 'flex justify-between items-center' : 'flex items-center gap-4'}`}>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">تكلفة الشحن</div>
                          <div className="font-bold text-blue-600">
                            {formatCurrency(order.shipping_cost || 0)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {order.shipping_address && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <span>{order.shipping_address}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Governorate Statistics */}
      {shippingStats.governorateStats.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              إحصائيات المحافظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {Array.from(shippingStats.governorateStats.entries()).map(([governorate, stats]) => (
                <Card key={governorate} className="border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <h3 className="font-bold text-lg mb-2">{governorate}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>إجمالي الطلبات:</span>
                          <Badge variant="outline">{stats.orders}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>في الانتظار:</span>
                          <Badge className="bg-orange-100 text-orange-800">{stats.pending}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>تم التوصيل:</span>
                          <Badge className="bg-green-100 text-green-800">{stats.delivered}</Badge>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span>إيرادات الشحن:</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(stats.shippingRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovedShippingReport;
