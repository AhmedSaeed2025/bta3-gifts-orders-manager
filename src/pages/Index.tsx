
import React from 'react';
import { Navigate } from 'react-router-dom';

const Index = () => {
  // توجيه المستخدم إلى برنامج الحسابات كصفحة افتراضية
  return <Navigate to="/legacy-admin" replace />;
};

export default Index;
