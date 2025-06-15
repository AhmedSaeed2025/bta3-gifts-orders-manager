
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // توجيه المستخدم إلى صفحة المتجر بدلاً من برنامج الحسابات
  return <Navigate to="/store" replace />;
};

export default Index;
