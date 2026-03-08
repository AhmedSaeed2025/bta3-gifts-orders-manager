
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutList, GripVertical, Eye, EyeOff, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  BarChart3, Package, ShoppingCart, Plus, Receipt, FileText, 
  Truck, Calculator, Settings, Printer, FileBarChart 
} from 'lucide-react';

const TABS_SETTINGS_KEY = 'app_tabs_settings';

interface TabConfig {
  id: string;
  label: string;
  defaultLabel: string;
  icon: string;
  visible: boolean;
}

const defaultTabs: TabConfig[] = [
  { id: 'dashboard', label: 'لوحة التحكم', defaultLabel: 'لوحة التحكم', icon: 'BarChart3', visible: true },
  { id: 'add-order', label: 'إضافة طلب', defaultLabel: 'إضافة طلب', icon: 'Plus', visible: true },
  { id: 'orders-management', label: 'إدارة الطلبات', defaultLabel: 'إدارة الطلبات', icon: 'ShoppingCart', visible: true },
  { id: 'products', label: 'إدارة المنتجات', defaultLabel: 'إدارة المنتجات', icon: 'Package', visible: true },
  { id: 'orders-report', label: 'تقرير الطلبات', defaultLabel: 'تقرير الطلبات', icon: 'FileText', visible: true },
  { id: 'shipping-report', label: 'تقرير الشحن', defaultLabel: 'تقرير الشحن', icon: 'Truck', visible: true },
  { id: 'account-statement', label: 'كشف الحساب', defaultLabel: 'كشف الحساب', icon: 'FileText', visible: true },
  { id: 'modern-account-statement', label: 'كشف محدث', defaultLabel: 'كشف محدث', icon: 'FileBarChart', visible: true },
  { id: 'summary-report', label: 'كشف ملخص', defaultLabel: 'كشف ملخص', icon: 'Calculator', visible: true },
  { id: 'printing-report', label: 'المطبعة', defaultLabel: 'المطبعة', icon: 'Printer', visible: true },
  { id: 'invoice', label: 'الفاتورة', defaultLabel: 'الفاتورة', icon: 'Receipt', visible: true },
  { id: 'settings', label: 'الإعدادات', defaultLabel: 'الإعدادات', icon: 'Settings', visible: true },
];

const iconMap: Record<string, React.ElementType> = {
  BarChart3, Plus, ShoppingCart, Package, FileText, Truck, FileBarChart, Calculator, Printer, Receipt, Settings
};

export const getTabsSettings = (): TabConfig[] => {
  try {
    const saved = localStorage.getItem(TABS_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as TabConfig[];
      // Merge with defaults to handle new tabs
      return defaultTabs.map(dt => {
        const found = parsed.find(p => p.id === dt.id);
        return found ? { ...dt, label: found.label, visible: found.visible } : dt;
      });
    }
  } catch (e) {
    console.error('Error loading tabs settings:', e);
  }
  return defaultTabs;
};

const TabsManagementSettings = () => {
  const [tabs, setTabs] = useState<TabConfig[]>(getTabsSettings);
  const [expandedTab, setExpandedTab] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(TABS_SETTINGS_KEY, JSON.stringify(tabs));
    // Dispatch event so StyledIndexTabs can react
    window.dispatchEvent(new Event('tabs-settings-changed'));
  }, [tabs]);

  const toggleVisibility = (id: string) => {
    // Don't allow hiding settings tab
    if (id === 'settings') return;
    setTabs(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const updateLabel = (id: string, label: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, label } : t));
  };

  const resetAll = () => {
    setTabs(defaultTabs);
  };

  const visibleCount = tabs.filter(t => t.visible).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-primary" />
              <CardTitle>إدارة التبويبات</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            تحكم في إظهار وإخفاء التبويبات وتخصيص أسمائها ({visibleCount} من {tabs.length} مفعّل)
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {tabs.map((tab) => {
            const Icon = iconMap[tab.icon] || BarChart3;
            const isExpanded = expandedTab === tab.id;
            const isSettings = tab.id === 'settings';

            return (
              <div
                key={tab.id}
                className={`border rounded-lg transition-colors ${
                  tab.visible 
                    ? 'border-border bg-card' 
                    : 'border-border/50 bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${tab.visible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className={`font-medium text-sm ${!tab.visible ? 'text-muted-foreground line-through' : ''}`}>
                        {tab.label}
                      </span>
                      {tab.label !== tab.defaultLabel && (
                        <p className="text-xs text-muted-foreground">الاسم الأصلي: {tab.defaultLabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTab(isExpanded ? null : tab.id)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Switch
                      checked={tab.visible}
                      onCheckedChange={() => toggleVisibility(tab.id)}
                      disabled={isSettings}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">اسم التبويب المخصص</Label>
                      <Input
                        value={tab.label}
                        onChange={(e) => updateLabel(tab.id, e.target.value)}
                        placeholder={tab.defaultLabel}
                        className="h-9"
                      />
                    </div>
                    {tab.label !== tab.defaultLabel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateLabel(tab.id, tab.defaultLabel)}
                        className="text-xs"
                      >
                        <RotateCcw className="h-3 w-3 ml-1" />
                        استعادة الاسم الأصلي
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabsManagementSettings;
