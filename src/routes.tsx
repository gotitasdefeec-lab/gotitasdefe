import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Reports from './pages/Reports';
import StoreSettings from './pages/StoreSettings';
import Customers from './pages/Customers';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

import Login from './pages/Login';
import PrivateRoute from './components/layout/PrivateRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
      <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
  <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
  <Route path="/store-settings" element={<PrivateRoute><StoreSettings /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      {/* <Route path="/settings" element={<PrivateRoute><StoreSettings /></PrivateRoute>} /> */}
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
    </Routes>
  );
};

export default AppRoutes;