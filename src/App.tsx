import React, { useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import ChangePassword from './pages/ChangePassword';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import StoreSettings from './pages/StoreSettings';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import PrivateRoute from './components/layout/PrivateRoute';
import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import baseTheme from './theme';
import { useSalesNotificationSound } from './hooks/useSalesNotificationSound';

const AdminLayout: React.FC = () => {
  const { sidebarOpen } = useApp();
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2.5, md: 3, lg: 3.5, xl: 4 },
          mt: { xs: 7, sm: 8 },
              ml: { 
                xs: 0, 
                md: sidebarOpen ? '240px' : 0 
              },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          width: '100%',
          transition: 'margin-left 0.3s ease-in-out',
          overflowX: 'hidden',
        }}
      >
        <Box sx={{ maxWidth: { xs: '100%', xl: 1920 }, mx: 'auto', width: '100%' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/products', element: <Products /> },
      { path: '/inventory', element: <Inventory /> },
      { path: '/sales', element: <Sales /> },
      { path: '/orders', element: <Sales /> },
      { path: '/customers', element: <Customers /> },
      // { path: '/users', element: <Users /> },
      // { path: '/reports', element: <Reports /> },
      { path: '/store-settings', element: <StoreSettings /> },
      { path: '/profile', element: <Profile /> },
      // { path: '/settings', element: <StoreSettings /> },
      { path: '/change-password', element: <ChangePassword /> },
      { path: '/notifications', element: <Notifications /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

const ThemedApp = () => {
  const { darkMode } = useApp();
  const salesAudio = useSalesNotificationSound();

  const theme = useMemo(
    () =>
      createTheme({
        ...baseTheme,
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
            contrastText: '#ffffff',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f7fa',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
          text: {
            primary: darkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
            secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          },
          success: {
            main: '#4caf50',
            light: '#81c784',
            dark: '#388e3c',
          },
          warning: {
            main: '#ff9800',
            light: '#ffb74d',
            dark: '#f57c00',
          },
          error: {
            main: '#f44336',
            light: '#e57373',
            dark: '#d32f2f',
          },
          info: {
            main: '#2196f3',
            light: '#64b5f6',
            dark: '#1976d2',
          },
          divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      {salesAudio}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ThemeProvider>
  );
};

function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <ThemedApp />
      </NotificationProvider>
    </AppProvider>
  );
}

export default App;
