import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { useDateFilter } from "@/components/tabs/StyledIndexTabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  AlertCircle,
  Target,
  Activity,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Crown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Legend,
} from "recharts";

const EnhancedAdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startDate, endDate } = useDateFilter();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Greeting by time of day
  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  }, [now]);

  // Fetch orders
  const { data: allOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["dashboard-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("user_id", user.id)
        .order("date_created", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("products")
        .select(`*, product_sizes (*)`)
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Filter by date
  const orders = useMemo(() => {
    if (!startDate && !endDate) return allOrders;
    return allOrders.filter((order) => {
      const d = new Date(order.date_created);
      if (startDate && d < startDate) return false;
      if (endDate && d > new Date(endDate.getTime() + 24 * 60 * 60 * 1000)) return false;
      return true;
    });
  }, [allOrders, startDate, endDate]);

  // Previous period for comparison (same length, immediately before)
  const previousPeriodOrders = useMemo(() => {
    if (!startDate || !endDate) return [];
    const len = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - len);
    const prevEnd = new Date(startDate.getTime());
    return allOrders.filter((o) => {
      const d = new Date(o.date_created);
      return d >= prevStart && d < prevEnd;
    });
  }, [allOrders, startDate, endDate]);

  // Stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "completed").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const inProgressOrders = orders.filter(
    (o) => !["delivered", "completed", "cancelled", "pending"].includes(o.status)
  ).length;

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalProfit = orders.reduce((s, o) => s + (Number(o.profit) || 0), 0);
  const totalShipping = orders.reduce((s, o) => s + (Number(o.shipping_cost) || 0), 0);
  const totalDeposit = orders.reduce((s, o) => s + (Number(o.deposit) || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  // Previous period stats for trend
  const prevRevenue = previousPeriodOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const prevOrdersCount = previousPeriodOrders.length;
  const prevProfit = previousPeriodOrders.reduce((s, o) => s + (Number(o.profit) || 0), 0);

  const pct = (curr: number, prev: number) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };
  const revenueTrend = pct(totalRevenue, prevRevenue);
  const ordersTrend = pct(totalOrders, prevOrdersCount);
  const profitTrend = pct(totalProfit, prevProfit);

  const activeProducts = products.filter((p: any) => p.is_active).length;
  const totalProducts = products.length;

  // Daily series — last 14 days (or full range if filtered)
  const seriesDays = 14;
  const dailySeries = useMemo(() => {
    const days: string[] = [];
    for (let i = seriesDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days.map((day) => {
      const dayOrders = orders.filter((o) => o.date_created?.split("T")[0] === day);
      return {
        date: new Date(day).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
        profit: dayOrders.reduce((s, o) => s + (Number(o.profit) || 0), 0),
      };
    });
  }, [orders]);

  const statusData = [
    { name: "تم التوصيل", value: completedOrders, color: "hsl(142 76% 36%)" },
    { name: "قيد التنفيذ", value: inProgressOrders, color: "hsl(45 93% 47%)" },
    { name: "في الانتظار", value: pendingOrders, color: "hsl(217 91% 60%)" },
    { name: "ملغي", value: cancelledOrders, color: "hsl(0 84% 60%)" },
  ].filter((s) => s.value > 0);

  // Top products
  const productPerformance = useMemo(() => {
    return products
      .map((product: any) => {
        const productOrders = orders.flatMap(
          (order: any) =>
            order.order_items?.filter((item: any) => item.product_type === product.name) || []
        );
        const totalSold = productOrders.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);
        const revenue = productOrders.reduce(
          (s: number, it: any) => s + Number(it.price || 0) * Number(it.quantity || 0),
          0
        );
        return { name: product.name, sold: totalSold, revenue };
      })
      .filter((p: any) => p.sold > 0)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [products, orders]);

  const maxProductRevenue = productPerformance[0]?.revenue || 1;

  // Recent activity
  const recentOrders = orders.slice(0, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-products"] });
    refetchOrders();
  };

  if (ordersLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-primary to-secondary text-primary-foreground shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90 mb-1">
              <Sparkles className="h-4 w-4" />
              <span>
                {now.toLocaleDateString("ar-EG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{greeting} 👋</h1>
            <p className="text-sm sm:text-base opacity-90">
              نظرة شاملة على أداء مشروعك في لمحة سريعة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-primary-foreground border-white/20 backdrop-blur"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="إجمالي الإيرادات"
          value={formatCurrency(totalRevenue)}
          trend={startDate && endDate ? revenueTrend : undefined}
          icon={DollarSign}
          accent="text-emerald-600"
          bg="from-emerald-500/10 to-emerald-500/5"
          ring="ring-emerald-500/20"
        />
        <KpiCard
          label="صافي الربح"
          value={formatCurrency(totalProfit)}
          trend={startDate && endDate ? profitTrend : undefined}
          icon={TrendingUp}
          accent="text-violet-600"
          bg="from-violet-500/10 to-violet-500/5"
          ring="ring-violet-500/20"
          subtitle={`هامش ${profitMargin.toFixed(1)}%`}
        />
        <KpiCard
          label="إجمالي الطلبات"
          value={String(totalOrders)}
          trend={startDate && endDate ? ordersTrend : undefined}
          icon={ShoppingCart}
          accent="text-blue-600"
          bg="from-blue-500/10 to-blue-500/5"
          ring="ring-blue-500/20"
        />
        <KpiCard
          label="متوسط قيمة الطلب"
          value={formatCurrency(averageOrderValue)}
          icon={Target}
          accent="text-amber-600"
          bg="from-amber-500/10 to-amber-500/5"
          ring="ring-amber-500/20"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat icon={Wallet} label="العربون المُحصَّل" value={formatCurrency(totalDeposit)} color="text-emerald-600" />
        <MiniStat icon={Truck} label="إجمالي الشحن" value={formatCurrency(totalShipping)} color="text-orange-600" />
        <MiniStat icon={Package} label="منتجات نشطة" value={`${activeProducts} / ${totalProducts}`} color="text-blue-600" />
        <MiniStat
          icon={CheckCircle2}
          label="معدل الإتمام"
          value={`${completionRate.toFixed(0)}%`}
          color="text-violet-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Performance area chart */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                الأداء خلال آخر 14 يوم
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">الإيرادات والأرباح اليومية</p>
            </div>
          </CardHeader>
          <CardContent className="pl-0 pr-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: string) => [
                    formatCurrency(Number(value)),
                    name === "revenue" ? "إيرادات" : "أرباح",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  name="revenue"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="hsl(262 83% 58%)"
                  strokeWidth={2}
                  fill="url(#profGrad)"
                  name="profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order status pie */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              حالة الطلبات
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">توزيع الطلبات حسب الحالة</p>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-muted-foreground">{s.name}</span>
                      </div>
                      <span className="font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                لا توجد طلبات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Top products + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top products */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              أفضل المنتجات مبيعاً
            </CardTitle>
            <p className="text-xs text-muted-foreground">أعلى 5 منتجات من حيث الإيرادات</p>
          </CardHeader>
          <CardContent>
            {productPerformance.length > 0 ? (
              <div className="space-y-4">
                {productPerformance.map((p: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{p.name}</span>
                      </div>
                      <div className="flex-shrink-0 text-left">
                        <div className="text-sm font-semibold text-primary">
                          {formatCurrency(p.revenue)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{p.sold} قطعة</div>
                      </div>
                    </div>
                    <Progress value={(p.revenue / maxProductRevenue) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                لا توجد بيانات مبيعات بعد
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              أحدث الطلبات
            </CardTitle>
            <p className="text-xs text-muted-foreground">آخر 5 طلبات تم تسجيلها</p>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((o: any) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-muted-foreground">#{o.serial}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-sm font-medium truncate">{o.client_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(o.date_created).toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div className="text-sm font-bold text-primary">{formatCurrency(o.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                لا توجد طلبات حديثة
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart alerts */}
      {(pendingOrders > 0 || inProgressOrders > 0) && (
        <Card className="border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/10 dark:border-amber-900/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">تنبيهات تحتاج لمتابعة</p>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders > 0 && `${pendingOrders} طلب في الانتظار`}
                  {pendingOrders > 0 && inProgressOrders > 0 && " • "}
                  {inProgressOrders > 0 && `${inProgressOrders} طلب قيد التنفيذ`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ----------- Sub-components ----------- */

interface KpiCardProps {
  label: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  accent: string;
  bg: string;
  ring: string;
  subtitle?: string;
}
const KpiCard = ({ label, value, trend, icon: Icon, accent, bg, ring, subtitle }: KpiCardProps) => {
  const positive = (trend ?? 0) >= 0;
  return (
    <Card className={`relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${bg} ring-1 ${ring}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</p>
          <div className={`p-2 rounded-lg bg-background/60 ${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-lg sm:text-2xl font-bold tracking-tight">{value}</p>
        <div className="flex items-center justify-between mt-2 min-h-[18px]">
          {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ml-auto ${
                positive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MiniStat = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) => (
  <Card className="border-border/60 shadow-sm hover:shadow transition-shadow">
    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm sm:text-base font-bold truncate">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
    delivered: { label: "تم التوصيل", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", Icon: CheckCircle2 },
    completed: { label: "مكتمل", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", Icon: CheckCircle2 },
    pending: { label: "في الانتظار", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400", Icon: Clock },
    cancelled: { label: "ملغي", className: "bg-red-500/15 text-red-700 dark:text-red-400", Icon: XCircle },
  };
  const meta =
    map[status] || { label: status, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400", Icon: Clock };
  const I = meta.Icon;
  return (
    <Badge variant="secondary" className={`${meta.className} border-0 text-[10px] gap-0.5 px-1.5 py-0`}>
      <I className="h-2.5 w-2.5" />
      {meta.label}
    </Badge>
  );
};

export default EnhancedAdminDashboard;
