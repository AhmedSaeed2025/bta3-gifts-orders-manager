
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LayoutList, GripVertical, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
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
  order: number;
}

const defaultTabs: TabConfig[] = [
  { id: 'dashboard', label: 'لوحة التحكم', defaultLabel: 'لوحة التحكم', icon: 'BarChart3', visible: true, order: 0 },
  { id: 'add-order', label: 'إضافة طلب', defaultLabel: 'إضافة طلب', icon: 'Plus', visible: true, order: 1 },
  { id: 'orders-management', label: 'إدارة الطلبات', defaultLabel: 'إدارة الطلبات', icon: 'ShoppingCart', visible: true, order: 2 },
  { id: 'products', label: 'إدارة المنتجات', defaultLabel: 'إدارة المنتجات', icon: 'Package', visible: true, order: 3 },
  { id: 'orders-report', label: 'تقرير الطلبات', defaultLabel: 'تقرير الطلبات', icon: 'FileText', visible: true, order: 4 },
  { id: 'shipping-report', label: 'تقرير الشحن', defaultLabel: 'تقرير الشحن', icon: 'Truck', visible: true, order: 5 },
  { id: 'account-statement', label: 'كشف الحساب', defaultLabel: 'كشف الحساب', icon: 'FileText', visible: true, order: 6 },
  { id: 'modern-account-statement', label: 'كشف محدث', defaultLabel: 'كشف محدث', icon: 'FileBarChart', visible: true, order: 7 },
  { id: 'summary-report', label: 'كشف ملخص', defaultLabel: 'كشف ملخص', icon: 'Calculator', visible: true, order: 8 },
  { id: 'printing-report', label: 'المطبعة', defaultLabel: 'المطبعة', icon: 'Printer', visible: true, order: 9 },
  { id: 'invoice', label: 'الفاتورة', defaultLabel: 'الفاتورة', icon: 'Receipt', visible: true, order: 10 },
  { id: 'settings', label: 'الإعدادات', defaultLabel: 'الإعدادات', icon: 'Settings', visible: true, order: 11 },
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
      const merged = defaultTabs.map((dt, idx) => {
        const found = parsed.find(p => p.id === dt.id);
        return found 
          ? { ...dt, label: found.label, visible: found.visible, order: found.order ?? idx } 
          : { ...dt, order: idx };
      });
      return merged.sort((a, b) => a.order - b.order);
    }
  } catch (e) {
    console.error('Error loading tabs settings:', e);
  }
  return defaultTabs;
};

const TabsManagementSettings = () => {
  const [tabs, setTabs] = useState<TabConfig[]>(getTabsSettings);
  const [expandedTab, setExpandedTab] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    localStorage.setItem(TABS_SETTINGS_KEY, JSON.stringify(tabs));
    window.dispatchEvent(new Event('tabs-settings-changed'));
  }, [tabs]);

  const toggleVisibility = (id: string) => {
    if (id === 'settings') return;
    setTabs(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
  };

  const updateLabel = (id: string, label: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, label } : t));
  };

  const resetAll = () => {
    setTabs(defaultTabs);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) return;

    setTabs(prev => {
      const newTabs = [...prev];
      const dragIdx = newTabs.findIndex(t => t.id === draggedId);
      const dropIdx = newTabs.findIndex(t => t.id === targetId);
      
      if (dragIdx === -1 || dropIdx === -1) return prev;

      const [dragged] = newTabs.splice(dragIdx, 1);
      newTabs.splice(dropIdx, 0, dragged);

      // Update order values
      return newTabs.map((t, i) => ({ ...t, order: i }));
    });

    setDraggedId(null);
  };

  // Move up/down helpers
  const moveTab = (id: string, direction: 'up' | 'down') => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const newTabs = [...prev];
      [newTabs[idx], newTabs[targetIdx]] = [newTabs[targetIdx], newTabs[idx]];
      return newTabs.map((t, i) => ({ ...t, order: i }));
    });
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
            تحكم في إظهار وإخفاء وترتيب التبويبات وتخصيص أسمائها ({visibleCount} من {tabs.length} مفعّل)
          </p>
          <p className="text-xs text-muted-foreground/70">
            اسحب وأفلت التبويبات لتغيير ترتيبها، أو استخدم أزرار الأسهم
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {tabs.map((tab, index) => {
            const Icon = iconMap[tab.icon] || BarChart3;
            const isExpanded = expandedTab === tab.id;
            const isSettings = tab.id === 'settings';
            const isDragging = draggedId === tab.id;
            const isDragOver = dragOverId === tab.id;

            return (
              <div
                key={tab.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tab.id)}
                onDragEnd={handleDragEnd}
                onDragEnter={(e) => handleDragEnter(e, tab.id)}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, tab.id)}
                className={`border rounded-lg transition-all duration-200 ${
                  isDragging 
                    ? 'opacity-50 scale-[0.98]' 
                    : isDragOver 
                      ? 'border-primary border-2 bg-primary/5 shadow-md' 
                      : tab.visible 
                        ? 'border-border bg-card hover:border-border/80' 
                        : 'border-border/50 bg-muted/30'
                } cursor-grab active:cursor-grabbing`}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/50 w-5 text-center font-mono">
                        {index + 1}
                      </span>
                    </div>
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
                  <div className="flex items-center gap-1">
                    {/* Move up/down buttons */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveTab(tab.id, 'up')}
                      disabled={index === 0}
                      className="h-7 w-7 p-0"
                      title="نقل لأعلى"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveTab(tab.id, 'down')}
                      disabled={index === tabs.length - 1}
                      className="h-7 w-7 p-0"
                      title="نقل لأسفل"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTab(isExpanded ? null : tab.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-3.5 w-3.5" />
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
