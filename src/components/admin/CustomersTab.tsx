import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { useDateFilter } from "@/components/tabs/StyledIndexTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ORDER_STATUS_LABELS, Order } from "@/types";
import {
  Users, Search, Crown, UserPlus, UserX, Wallet, TrendingUp, ChevronDown, ChevronUp,
  RefreshCw, Copy, Phone, MapPin, MessageCircle, Download, ShoppingBag, Eye, X,
} from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB");

type Segment = "vip" | "loyal" | "new" | "inactive";
const SEGMENT: Record<Segment, { label: string; cls: string }> = {
  vip: { label: "VIP", cls: "bg-primary text-primary-foreground" },
  loyal: { label: "متكرر", cls: "bg-accent text-accent-foreground" },
  new: { label: "جديد", cls: "bg-secondary text-secondary-foreground" },
  inactive: { label: "غير نشط", cls: "bg-muted text-muted-foreground" },
};

interface Customer {
  key: string;
  name: string;
  phone: string;
  phone2: string;
  governorate: string;
  address: string;
  orders: Order[];
  count: number;
  spent: number;
  profit: number;
  remaining: number;
  avg: number;
  first: string;
  last: string;
  segment: Segment;
  topProduct: string;
}

const CustomersTab = () => {
  const { orders, loading } = useSupabaseOrders() as any;
  const { startDate, endDate } = useDateFilter();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [gov, setGov] = useState("all");
  const [segment, setSegment] = useState("all");
  const [balance, setBalance] = useState("all");
  const [sortBy, setSortBy] = useState("spent");
  const [expanded, setExpanded] = useState<string | null>(null);

  const customers = useMemo<Customer[]>(() => {
    const list: Order[] = (orders || []).filter((o: Order) => {
      if (o.status === "cancelled") return false;
      const d = new Date(o.dateCreated);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
    const map = new Map<string, Customer>();
    list.forEach((o) => {
      const key = (o.phone || "").replace(/\D/g, "") || o.clientName.trim();
      let c = map.get(key);
      if (!c) {
        c = {
          key, name: o.clientName, phone: o.phone, phone2: o.phone2 || "", governorate: o.governorate || "",
          address: o.address || "", orders: [], count: 0, spent: 0, profit: 0, remaining: 0, avg: 0,
          first: o.dateCreated, last: o.dateCreated, segment: "new", topProduct: "",
        };
        map.set(key, c);
      }
      c.orders.push(o);
      c.count++;
      c.spent += o.total;
      c.profit += o.profit;
      if (o.status !== "delivered") c.remaining += Math.max(0, o.total - (o.deposit || 0));
      if (o.dateCreated < c.first) c.first = o.dateCreated;
      if (o.dateCreated >= c.last) {
        c.last = o.dateCreated;
        c.name = o.clientName;
        if (o.address && o.address !== "-") c.address = o.address;
        if (o.governorate) c.governorate = o.governorate;
        if (o.phone2) c.phone2 = o.phone2;
      }
    });
    const cutoff = Date.now() - 90 * 864e5;
    const all = Array.from(map.values());
    const spends = all.map((c) => c.spent).sort((a, b) => b - a);
    const vipThreshold = spends[Math.floor(spends.length * 0.1)] ?? Infinity;
    all.forEach((c) => {
      c.avg = c.spent / c.count;
      c.orders.sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));
      const pc: Record<string, number> = {};
      c.orders.forEach((o) => o.items.forEach((i) => (pc[i.productType] = (pc[i.productType] || 0) + i.quantity)));
      c.topProduct = Object.entries(pc).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
      if (new Date(c.last).getTime() < cutoff) c.segment = "inactive";
      else if (c.spent >= vipThreshold && c.count >= 2) c.segment = "vip";
      else if (c.count >= 2) c.segment = "loyal";
      else c.segment = "new";
    });
    return all;
  }, [orders, startDate, endDate]);

  const governorates = useMemo(
    () => Array.from(new Set(customers.map((c) => c.governorate).filter(Boolean))).sort(),
    [customers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) =>
        (!q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.phone2.includes(q) ||
          c.orders.some((o) => o.serial.toLowerCase().includes(q))) &&
        (gov === "all" || c.governorate === gov) &&
        (segment === "all" || c.segment === segment) &&
        (balance === "all" || (balance === "due" ? c.remaining > 0 : c.remaining === 0))
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "count": return b.count - a.count;
          case "last": return b.last.localeCompare(a.last);
          case "profit": return b.profit - a.profit;
          case "remaining": return b.remaining - a.remaining;
          case "name": return a.name.localeCompare(b.name, "ar");
          default: return b.spent - a.spent;
        }
      });
  }, [customers, search, gov, segment, balance, sortBy]);

  const stats = useMemo(() => {
    const revenue = customers.reduce((s, c) => s + c.spent, 0);
    const ordersCount = customers.reduce((s, c) => s + c.count, 0);
    return {
      total: customers.length,
      vip: customers.filter((c) => c.segment === "vip").length,
      repeat: customers.filter((c) => c.count >= 2).length,
      inactive: customers.filter((c) => c.segment === "inactive").length,
      revenue,
      avgValue: ordersCount ? revenue / ordersCount : 0,
      remaining: customers.reduce((s, c) => s + c.remaining, 0),
      repeatRate: customers.length ? (customers.filter((c) => c.count >= 2).length / customers.length) * 100 : 0,
    };
  }, [customers]);

  const hasFilters = search || gov !== "all" || segment !== "all" || balance !== "all";
  const resetFilters = () => { setSearch(""); setGov("all"); setSegment("all"); setBalance("all"); };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("تم النسخ"); };
  const whatsapp = (phone: string) => {
    const p = phone.replace(/\D/g, "").replace(/^0/, "20");
    window.open(`https://wa.me/${p}`, "_blank");
  };

  const exportExcel = () => {
    const rows = filtered.map((c) => ({
      "العميل": c.name, "الهاتف": c.phone, "هاتف إضافي": c.phone2, "المحافظة": c.governorate, "العنوان": c.address,
      "التصنيف": SEGMENT[c.segment].label, "عدد الطلبات": c.count, "إجمالي المشتريات": Math.round(c.spent),
      "متوسط الطلب": Math.round(c.avg), "الربح": Math.round(c.profit), "المتبقي": Math.round(c.remaining),
      "المنتج المفضل": c.topProduct, "أول طلب": fmtDate(c.first), "آخر طلب": fmtDate(c.last),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] } as any;
    XLSX.utils.book_append_sheet(wb, ws, "العملاء");
    XLSX.writeFile(wb, `customers-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const Stat = ({ icon: Icon, label, value, sub }: any) => (
    <Card className="rounded-2xl border-border/50 hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold tabular-nums font-mono truncate">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
          {sub && <div className="text-[10px] text-muted-foreground/80">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-l from-primary/15 via-primary/5 to-transparent border border-border/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> العملاء</h2>
          <p className="text-sm text-muted-foreground">قائمة العملاء وتقرير طلباتهم — مرتبطة بفلتر التاريخ العام</p>
        </div>
        <Button onClick={exportExcel} variant="outline" className="gap-2" disabled={!filtered.length}>
          <Download className="h-4 w-4" /> تصدير Excel
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="إجمالي العملاء" value={fmt(stats.total)} sub={`${fmt(stats.repeat)} عميل متكرر`} />
        <Stat icon={Crown} label="عملاء VIP" value={fmt(stats.vip)} sub={`نسبة التكرار ${stats.repeatRate.toFixed(0)}%`} />
        <Stat icon={Wallet} label="إجمالي المشتريات" value={fmt(stats.revenue)} sub={`متوسط الطلب ${fmt(stats.avgValue)}`} />
        <Stat icon={UserX} label="مبالغ متبقية" value={fmt(stats.remaining)} sub={`${fmt(stats.inactive)} عميل غير نشط`} />
      </div>

      {/* Filters */}
      <Card className="rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="بحث بالاسم، الهاتف أو رقم الطلب..." value={search}
                onChange={(e) => setSearch(e.target.value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))))}
                className="pr-10" />
            </div>
            <Select value={gov} onValueChange={setGov}>
              <SelectTrigger><SelectValue placeholder="المحافظة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المحافظات</SelectItem>
                {governorates.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger><SelectValue placeholder="التصنيف" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التصنيفات</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="loyal">متكرر</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
                <SelectItem value="inactive">غير نشط (+90 يوم)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={balance} onValueChange={setBalance}>
              <SelectTrigger><SelectValue placeholder="الرصيد" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأرصدة</SelectItem>
                <SelectItem value="due">عليه متبقي</SelectItem>
                <SelectItem value="clear">خالص</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="ترتيب" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spent">الأعلى مشتريات</SelectItem>
                <SelectItem value="count">الأكثر طلبات</SelectItem>
                <SelectItem value="profit">الأعلى ربحًا</SelectItem>
                <SelectItem value="remaining">الأعلى متبقي</SelectItem>
                <SelectItem value="last">آخر طلب</SelectItem>
                <SelectItem value="name">الاسم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>عرض <b className="text-foreground font-mono">{filtered.length}</b> من {customers.length} عميل</span>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={resetFilters} className="gap-1 h-7"><X className="h-3 w-3" /> مسح الفلاتر</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-12 text-center text-muted-foreground">
          {hasFilters ? "لا توجد نتائج تطابق الفلاتر" : "لا يوجد عملاء في الفترة المحددة"}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const open = expanded === c.key;
            const lastOrder = c.orders[0];
            return (
              <Card key={c.key} className="rounded-2xl overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
                <CardContent className="p-0">
                  <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 lg:w-72 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0">
                        {c.name.trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold flex items-center gap-2 flex-wrap">
                          <span className="truncate">{c.name}</span>
                          <Badge className={`${SEGMENT[c.segment].cls} text-[10px] px-2 py-0`}>{SEGMENT[c.segment].label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="font-mono flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" />{c.phone}</span>
                          {c.governorate && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.governorate}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 flex-1 text-center">
                      {[
                        ["الطلبات", fmt(c.count)],
                        ["المشتريات", fmt(c.spent)],
                        ["متوسط", fmt(c.avg)],
                        ["المتبقي", fmt(c.remaining)],
                        ["آخر طلب", fmtDate(c.last)],
                      ].map(([l, v], i) => (
                        <div key={l} className={`rounded-lg bg-muted/40 py-1.5 ${i > 2 ? "hidden md:block" : ""}`}>
                          <div className={`font-mono font-bold text-sm tabular-nums ${l === "المتبقي" && c.remaining > 0 ? "text-destructive" : ""}`}>{v}</div>
                          <div className="text-[10px] text-muted-foreground">{l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" className="gap-1" onClick={() => navigate(`/reorder/${lastOrder.serial}`)}>
                        <RefreshCw className="h-3.5 w-3.5" /> إعادة الطلب
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" title="واتساب" onClick={() => whatsapp(c.phone)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8" title="نسخ البيانات"
                        onClick={() => copy([c.name, c.phone, c.phone2, c.governorate, c.address].filter(Boolean).join("\n"))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => setExpanded(open ? null : c.key)}>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} الطلبات
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t bg-muted/20 p-4 space-y-4 animate-in fade-in-50">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <Info label="هاتف إضافي" value={c.phone2 || "-"} mono onCopy={c.phone2 ? () => copy(c.phone2) : undefined} />
                        <Info label="العنوان" value={c.address || "-"} onCopy={c.address ? () => copy(c.address) : undefined} />
                        <Info label="المنتج المفضل" value={c.topProduct} />
                        <Info label="عميل منذ" value={fmtDate(c.first)} mono />
                        <Info label="إجمالي الربح" value={fmt(c.profit)} mono />
                        <Info label="عدد القطع" value={fmt(c.orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0))} mono />
                      </div>

                      <div className="rounded-xl border bg-card overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-xs text-muted-foreground">
                            <tr>
                              {["رقم الطلب", "التاريخ", "الأصناف", "الحالة", "الإجمالي", "العربون", "المتبقي", ""].map((h) => (
                                <th key={h} className="p-2.5 text-center font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {c.orders.map((o) => {
                              const rem = Math.max(0, o.total - (o.deposit || 0));
                              return (
                                <tr key={o.serial} className="border-t hover:bg-muted/30">
                                  <td className="p-2.5 text-center font-mono">{o.serial}</td>
                                  <td className="p-2.5 text-center font-mono">{fmtDate(o.dateCreated)}</td>
                                  <td className="p-2.5 text-center text-xs max-w-[220px]">
                                    {o.items.map((i) => `${i.productType} (${i.size}) ×${i.quantity}`).join("، ")}
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <Badge variant="outline" className="text-[10px]">{ORDER_STATUS_LABELS[o.status] || o.status}</Badge>
                                  </td>
                                  <td className="p-2.5 text-center font-mono font-semibold">{fmt(o.total)}</td>
                                  <td className="p-2.5 text-center font-mono">{fmt(o.deposit)}</td>
                                  <td className={`p-2.5 text-center font-mono ${rem > 0 && o.status !== "delivered" ? "text-destructive" : ""}`}>
                                    {o.status === "delivered" ? "0" : fmt(rem)}
                                  </td>
                                  <td className="p-2.5">
                                    <div className="flex justify-center gap-1">
                                      <Button size="icon" variant="ghost" className="h-7 w-7" title="عرض" onClick={() => navigate(`/order/${o.serial}`)}>
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-7 w-7" title="إعادة هذا الطلب" onClick={() => navigate(`/reorder/${o.serial}`)}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value, mono, onCopy }: { label: string; value: string; mono?: boolean; onCopy?: () => void }) => (
  <div className="rounded-lg bg-card border p-2.5 flex items-start justify-between gap-2">
    <div className="min-w-0">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm break-words ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
    {onCopy && (
      <button onClick={onCopy} className="text-muted-foreground hover:text-primary shrink-0" title="نسخ"><Copy className="h-3.5 w-3.5" /></button>
    )}
  </div>
);

export default CustomersTab;
