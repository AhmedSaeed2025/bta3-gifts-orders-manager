
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseOrders } from "@/context/SupabaseOrderContext";
import { formatCurrency } from "@/lib/utils";
import ProfitFilters from "./reports/ProfitFilters";
import ProfitSummaryCards from "./reports/ProfitSummaryCards";
import ProfitChart from "./reports/ProfitChart";
import ProfitTable from "./reports/ProfitTable";

const ProfitReport = () => {
  const { orders, loading } = useSupabaseOrders();
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");

  // Calculate profit data excluding deposits and shipping costs
  const profitData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders.map(order => {
      const orderItems = order.items || [];
      let totalCost = 0;
      let totalSales = 0; // Only product sales, excluding shipping
      let totalDiscounts = order.discount || 0;
      
      orderItems.forEach(item => {
        const itemSales = (item.price - (item.itemDiscount || 0)) * item.quantity;
        const itemCost = item.cost * item.quantity;
        
        totalSales += itemSales;
        totalCost += itemCost;
      });
      
      // Net profit = Sales - Cost - Discounts (excluding shipping and deposits)
      const netProfit = totalSales - totalCost - totalDiscounts;
      
      return {
        ...order,
        calculatedProfit: netProfit,
        productSales: totalSales,
        productCosts: totalCost,
        totalDiscounts: totalDiscounts
      };
    });
  }, [orders]);

  // Filter data
  const filteredData = useMemo(() => {
    return profitData.filter(order => {
      const orderDate = new Date(order.date_created);
      const orderYear = orderDate.getFullYear().toString();
      const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      
      const yearMatch = filterYear === "all" || orderYear === filterYear;
      const monthMatch = filterMonth === "all" || orderMonth === filterMonth;
      
      let productMatch = true;
      if (filterProduct !== "all") {
        productMatch = order.items?.some(item => item.productType === filterProduct) || false;
      }
      
      return yearMatch && monthMatch && productMatch;
    });
  }, [profitData, filterMonth, filterYear, filterProduct]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalCost = filteredData.reduce((sum, order) => sum + order.productCosts, 0);
    const totalSales = filteredData.reduce((sum, order) => sum + order.productSales, 0);
    const totalDiscounts = filteredData.reduce((sum, order) => sum + order.totalDiscounts, 0);
    const netProfit = filteredData.reduce((sum, order) => sum + order.calculatedProfit, 0);
    const totalItems = filteredData.reduce((sum, order) => 
      sum + (order.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0
    );
    const totalOrders = filteredData.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalCost,
      totalSales,
      totalShipping: 0, // Excluded from profit calculations
      totalDiscounts,
      netProfit,
      totalItems,
      totalOrders,
      avgOrderValue
    };
  }, [filteredData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const monthlyData = {};
    
    filteredData.forEach(order => {
      const date = new Date(order.date_created);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthKey,
          تكاليف: 0,
          مبيعات: 0,
          خصومات: 0,
          أرباح: 0
        };
      }
      
      monthlyData[monthKey].تكاليف += order.productCosts;
      monthlyData[monthKey].مبيعات += order.productSales;
      monthlyData[monthKey].خصومات += order.totalDiscounts;
      monthlyData[monthKey].أرباح += order.calculatedProfit;
    });
    
    return Object.values(monthlyData);
  }, [filteredData]);

  // Prepare table data
  const tableData = useMemo(() => {
    return filteredData.map(order => ({
      month: new Date(order.date_created).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }),
      productType: order.items?.map(item => item.productType).join(', ') || '',
      quantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      totalCost: order.productCosts,
      totalSales: order.productSales,
      totalShipping: 0, // Excluded
      totalDiscounts: order.totalDiscounts,
      netProfit: order.calculatedProfit
    }));
  }, [filteredData]);

  // Get available years and products
  const availableYears = useMemo(() => {
    const years = [...new Set(orders.map(order => 
      new Date(order.date_created).getFullYear().toString()
    ))];
    return years.sort().reverse();
  }, [orders]);

  const availableProducts = useMemo(() => {
    const products = new Set();
    orders.forEach(order => {
      order.items?.forEach(item => products.add(item.productType));
    });
    return Array.from(products).sort();
  }, [orders]);

  const handleClearFilters = () => {
    setFilterMonth("all");
    setFilterYear("all");
    setFilterProduct("all");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل تقرير الأرباح...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold mb-2">تقرير الأرباح</h2>
        <p className="text-gray-600 text-sm">
          * تم استبعاد العربون وتكاليف الشحن من حسابات الأرباح
        </p>
      </div>

      <ProfitFilters
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        filterProduct={filterProduct}
        setFilterProduct={setFilterProduct}
        availableYears={availableYears}
        availableProducts={availableProducts}
        onClearFilters={handleClearFilters}
        onExportExcel={() => {}}
        onExportPDF={() => {}}
      />

      <ProfitSummaryCards summary={summary} />

      <ProfitChart chartData={chartData} />

      <ProfitTable data={tableData} />
    </div>
  );
};

export default ProfitReport;
