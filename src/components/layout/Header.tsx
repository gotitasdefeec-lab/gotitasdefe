import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Tooltip,
  Divider,
  ListItemIcon,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountCircle,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useNotifications } from '../../context/NotificationContext';

const Header = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    sidebarOpen,
    toggleSidebar,
  } = useApp();

  const {
    unreadCount,
    markAsRead,
    getNotifications,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [searchAnchor, setSearchAnchor] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleSearchOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSearchAnchor(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchor(null);
  };

  const handleLogout = () => {
    try {
      logout();
    } catch (e) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
    }
    navigate('/login');
  };

  // Obtener solo las últimas 5 notificaciones para el popover
  const notifications = getNotifications({ limit: 5 });

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      handleNotificationsClose();
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Hace más de un día';
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(30, 41, 59, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            onClick={toggleSidebar}
            sx={{ 
              mr: { xs: 0, sm: 1 },
              p: { xs: 1, sm: 1.5 },
              color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#6366f1',
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(99,102,241,0.08)',
              },
            }}
            title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.01em',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Dashboard
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          <Tooltip title="Búsqueda rápida">
            <IconButton 
              onClick={handleSearchOpen}
              size="small"
              sx={{
                p: { xs: 0.75, sm: 1 },
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#64748b',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notificaciones">
            <IconButton 
              onClick={handleNotificationsOpen}
              size="small"
              sx={{
                p: { xs: 0.75, sm: 1 },
                color: (theme) => theme.palette.mode === 'dark' ? '#e2e8f0' : '#64748b',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              <Badge 
                badgeContent={unreadCount} 
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: { xs: '0.6rem', sm: '0.7rem' },
                    minWidth: { xs: '16px', sm: '20px' },
                    height: { xs: '16px', sm: '20px' },
                  },
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Ayuda eliminada */}

          <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.5, sm: 1 }, borderColor: 'divider', display: { xs: 'none', sm: 'block' } }} />

          <Tooltip title={currentUser?.name || 'Usuario'}>
            <IconButton
              size="small"
              aria-label="cuenta del usuario"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                p: { xs: 0.5, sm: 1 },
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              {currentUser?.avatar ? (
                <Avatar
                  alt={currentUser.name}
                  src={currentUser.avatar}
                  sx={{ 
                    width: { xs: 32, sm: 36 }, 
                    height: { xs: 32, sm: 36 },
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  <AccountCircle fontSize="small" />
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Menú de Usuario */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            Mi Perfil
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Cerrar Sesión
          </MenuItem>
        </Menu>

        {/* Popover de Notificaciones */}
        <Popover
          open={Boolean(notificationsAnchor)}
          anchorEl={notificationsAnchor}
          onClose={handleNotificationsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: { xs: '90vw', sm: 400 },
              maxWidth: '400px',
            }
          }}
        >
          <Card sx={{ width: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Notificaciones
                </Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" color="primary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              {notifications.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    No hay notificaciones
                  </Typography>
                </Box>
              ) : (
                <List sx={{ width: '100%', maxHeight: { xs: '60vh', sm: 400 }, overflow: 'auto', p: 0 }}>
                  {notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          bgcolor: notification.read ? 'transparent' : 'action.hover',
                          cursor: 'pointer',
                          borderRadius: 1,
                          mb: 0.5,
                          px: { xs: 1, sm: 2 },
                          py: { xs: 1, sm: 1.5 },
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                        }}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: `${notification.type}.main`, 
                            width: { xs: 32, sm: 36 }, 
                            height: { xs: 32, sm: 36 } 
                          }}>
                            <NotificationsIcon fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontWeight={notification.read ? 400 : 600}
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              }}
                            >
                              {notification.message}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                              {getRelativeTime(notification.timestamp)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="text"
                  fullWidth
                  size="small"
                  onClick={() => {
                    navigate('/notifications');
                    handleNotificationsClose();
                  }}
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  Ver todas las notificaciones
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Popover>

        {/* Menú de Configuración removido, ahora en Sidebar */}

        {/* Popover de Búsqueda */}
        <Popover
          open={Boolean(searchAnchor)}
          anchorEl={searchAnchor}
          onClose={handleSearchClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="subtitle2" gutterBottom>
              Búsqueda Rápida
            </Typography>
            {/* Implementar componente de búsqueda aquí */}
          </Box>
        </Popover>
      </Toolbar>
    </AppBar>
  );
};

export default Header;