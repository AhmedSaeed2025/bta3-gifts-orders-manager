
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const Index = () => {
  const location = useLocation();
  
  // إذا كان المستخدم في صفحة /legacy-admin، عرض برنامج الحسابات
  if (location.pathname === '/legacy-admin') {
    return (
      <div>
        {/* هنا سيتم عرض برنامج الحسابات */}
        <h1>برنامج الحسابات</h1>
        {/* يمكن إضافة مكونات برنامج الحسابات هنا */}
      </div>
    );
  }
  
  // توجيه المستخدم إلى صفحة المتجر بدلاً من برنامج الحسابات
  return <Navigate to="/store" replace />;
};

export default Index;
