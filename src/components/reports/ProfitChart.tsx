
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp } from "lucide-react";

interface ProfitChartProps {
  chartData: Array<{
    name: string;
    تكاليف: number;
    مبيعات: number;
    شحن: number;
    خصومات: number;
    أرباح: number;
  }>;
}

const ProfitChart: React.FC<ProfitChartProps> = ({ chartData }) => {
  const isMobile = useIsMobile();

  const tooltipFormatter = (value: any) => {
    if (typeof value === 'number') {
      return `${value.toFixed(2)} جنيه`;
    }
    return `${value} جنيه`;
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className={`${isMobile ? "text-base" : "text-lg"} font-medium flex items-center gap-2`}>
          <TrendingUp className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
          الرسم البياني للأرباح والتكاليف
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${isMobile ? "h-64" : "h-80"} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                fontSize={isMobile ? 10 : 12}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
              />
              <YAxis fontSize={isMobile ? 10 : 12} />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              />
              <Legend fontSize={isMobile ? 10 : 12} />
              <Bar dataKey="تكاليف" fill="#ef4444" name="التكاليف" />
              <Bar dataKey="مبيعات" fill="#3b82f6" name="المبيعات" />
              <Bar dataKey="شحن" fill="#f97316" name="الشحن" />
              <Bar dataKey="خصومات" fill="#8b5cf6" name="الخصومات" />
              <Bar dataKey="أرباح" fill="#22c55e" name="الأرباح" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitChart;
