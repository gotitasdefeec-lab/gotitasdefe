import PrivateRoute from '@/components/PrivateRoute';
import React from 'react';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRoute>{children}</PrivateRoute>;
}
