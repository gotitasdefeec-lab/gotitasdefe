import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box, useMediaQuery } from '@mui/material';
import {
  Dashboard,
  Inventory,
  ShoppingCart,
  Store,
  People,
  Brightness4,
  Brightness7,
  Category, // nuevo icono para Productos
} from '@mui/icons-material';
import { Switch, Divider } from '@mui/material';
import { useApp } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';


const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode, currentUser, sidebarOpen, setSidebarOpen } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Productos', icon: <Category />, path: '/products' },
    { text: 'Inventario', icon: <Inventory />, path: '/inventory' },
    { text: 'Pedidos', icon: <ShoppingCart />, path: '/sales' },
    { text: 'Clientes', icon: <People />, path: '/customers' },
    { text: 'Tienda', icon: <Store />, path: '/store-settings' },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    // Cerrar el sidebar en móvil después de navegar
    if (isMobile && setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={sidebarOpen}
      onClose={() => setSidebarOpen && setSidebarOpen(false)}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: collapsed && !isMobile && sidebarOpen ? 80 : { xs: 280, sm: 26 },
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        '& .MuiDrawer-paper': {
          width: collapsed && !isMobile && sidebarOpen ? 80 : { xs: 280, sm: 240 },
          boxSizing: 'border-box',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #18122B 0%, #312e81 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#fff',
          borderRight: 'none',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          backdropFilter: 'blur(18px)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Collapse/Expand Button */}
        <Box sx={{ 
          p: 2, 
          display: { xs: 'none', md: 'flex' }, 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-end' 
        }}>
          <Box
            onClick={() => setCollapsed((c) => !c)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'rgba(255,255,255,0.22)',
                boxShadow: '0 2px 8px 0 rgba(99,102,241,0.15)',
              },
            }}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span style={{
              display: 'block',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: collapsed ? '10px solid #fff' : 'none',
              borderRight: collapsed ? 'none' : '10px solid #fff',
              marginLeft: collapsed ? 0 : 8,
              marginRight: collapsed ? 8 : 0,
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'all 0.2s',
            }} />
          </Box>
        </Box>

        {/* Logo/Brand */}
        <Box 
          sx={{ 
            p: collapsed ? 0 : { xs: 2, sm: 3 },
            pt: collapsed ? 0 : { xs: 2, sm: 1 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'padding 0.3s',
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.22)',
              boxShadow: '0 4px 24px 0 rgba(99,102,241,0.12)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              color: '#fff',
              transition: 'all 0.3s',
            }}
          >
            A
          </Box>
          {!collapsed && (
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: '-0.01em', 
                transition: 'opacity 0.3s',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              Admin Panel
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: collapsed ? 1 : 2, my: 1 }} />

        {/* Menu Items */}
        <List sx={{ flexGrow: 1, px: collapsed ? 0.5 : { xs: 1.5, sm: 2 }, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                  boxShadow: isActive ? '0 2px 12px 0 rgba(99,102,241,0.10)' : 'none',
                  backdropFilter: isActive ? 'blur(12px)' : 'none',
                  transition: 'all 0.2s',
                  minHeight: { xs: 44, sm: 48 },
                  position: 'relative',
                  pl: collapsed ? 1.5 : { xs: 2, sm: 2.5 },
                  pr: collapsed ? 1.5 : { xs: 1.5, sm: 2 },
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.13)',
                    transform: 'translateX(4px) scale(1.03)',
                    boxShadow: '0 4px 16px 0 rgba(99,102,241,0.13)',
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isActive ? 5 : 0,
                    height: isActive ? '60%' : 0,
                    background: 'linear-gradient(180deg, #fff 0%, #a5b4fc 100%)',
                    borderRadius: '0 4px 4px 0',
                    transition: 'all 0.2s',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: '#fff',
                    minWidth: { xs: 36, sm: 40 },
                    justifyContent: 'center',
                    '& svg': {
                      fontSize: { xs: '1.3rem', sm: '1.5rem' },
                      filter: isActive ? 'drop-shadow(0 0 10px #fff)' : 'none',
                      transition: 'filter 0.2s',
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: { xs: '0.9rem', sm: '0.97rem' },
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: collapsed ? 1 : 2, my: 1 }} />

        {/* Dark Mode Toggle */}
        <Box sx={{ p: collapsed ? 1 : { xs: 1.5, sm: 2 }, px: collapsed ? 1 : { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(255, 255, 255, 0.13)',
              borderRadius: 2,
              p: collapsed ? 0.5 : { xs: 1.2, sm: 1.5 },
              backdropFilter: 'blur(10px)',
              minHeight: { xs: 32, sm: 36 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
              {darkMode ? <Brightness4 fontSize="small" /> : <Brightness7 fontSize="small" />}
              {!collapsed && (
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {darkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </Typography>
              )}
            </Box>
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#fff',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            />
          </Box>
        </Box>

        {/* User Avatar/Name at Bottom */}
        <Box
          sx={{
            width: '100%',
            px: collapsed ? 0 : { xs: 2, sm: 3 },
            pb: { xs: 1.5, sm: 2 },
            pt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
            minHeight: { xs: 48, sm: 56 },
            transition: 'padding 0.3s',
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              boxShadow: '0 2px 8px 0 rgba(99,102,241,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: '#fff',
              overflow: 'hidden',
            }}
          >
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%' 
                }} 
              />
            ) : (
              (currentUser?.name?.[0] || 'U').toUpperCase()
            )}
          </Box>
          {!collapsed && (
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' }, color: '#fff' }}>
                {currentUser?.name || 'Usuario'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                {currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;