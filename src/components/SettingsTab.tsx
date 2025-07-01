
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, DollarSign, Image, Package } from "lucide-react";
import PriceDiscountManager from "./admin/PriceDiscountManager";

const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground">إدارة إعدادات المتجر والمنتجات</p>
        </div>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            الأسعار والخصومات
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            الوسائط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices">
          <PriceDiscountManager />
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                سيتم إضافة إدارة المنتجات قريباً...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الوسائط</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                سيتم إضافة إدارة الصور والفيديوهات قريباً...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
