import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as ClearAllIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  Settings as SystemIcon,
  Person as UserIcon,
  Category as ProductIcon,
  NotificationsActive as PushIcon,
} from '@mui/icons-material';
import { useNotifications, Notification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { pushNotificationService } from '../services/pushNotificationService';

const Notifications = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
  } = useNotifications();

  const [currentTab, setCurrentTab] = useState(0);
  const [filterType, setFilterType] = useState<Notification['type'] | 'all'>('all');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    const types: Array<Notification['type'] | 'all'> = ['all', 'warning', 'error', 'success', 'info'];
    setFilterType(types[newValue]);
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') {
      return notifications;
    }
    return notifications.filter(n => n.type === filterType);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
    }
  };

  const getCategoryIcon = (category?: Notification['category']) => {
    switch (category) {
      case 'stock':
        return <InventoryIcon fontSize="small" />;
      case 'sales':
        return <SalesIcon fontSize="small" />;
      case 'system':
        return <SystemIcon fontSize="small" />;
      case 'user':
        return <UserIcon fontSize="small" />;
      case 'product':
        return <ProductIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  // Check push notification support and subscription status
  useEffect(() => {
    const checkPushStatus = async () => {
      const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(supported);
      
      if (supported) {
        const subscribed = await pushNotificationService.isSubscribed();
        setPushEnabled(subscribed);
      }
    };
    
    checkPushStatus();
  }, []);

  const handlePushToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    setPushLoading(true);

    try {
      if (enabled) {
        const success = await pushNotificationService.subscribe();
        if (success) {
          setPushEnabled(true);
          addNotification('✅ Notificaciones push activadas correctamente', 'success', {
            category: 'system',
            showToast: true,
          });
        } else {
          addNotification('❌ Error al activar notificaciones push', 'error', {
            category: 'system',
            showToast: true,
          });
        }
      } else {
        const success = await pushNotificationService.unsubscribe();
        if (success) {
          setPushEnabled(false);
          addNotification('ℹ️ Notificaciones push desactivadas', 'info', {
            category: 'system',
            showToast: true,
          });
        } else {
          addNotification('❌ Error al desactivar notificaciones push', 'error', {
            category: 'system',
            showToast: true,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      addNotification('❌ Error al cambiar configuración de notificaciones', 'error', {
        category: 'system',
        showToast: true,
      });
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendTestNotification();
      addNotification('🧪 Notificación de prueba enviada', 'success', {
        category: 'system',
        showToast: true,
      });
    } catch (error) {
      addNotification('❌ Error al enviar notificación de prueba', 'error', {
        category: 'system',
        showToast: true,
      });
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}>
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 2.5, md: 3 },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box>
            <Typography 
              variant="h5" 
              fontWeight="600" 
              gutterBottom 
              component="div"
              sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              Notificaciones
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              component="div"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {unreadCount > 0 ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'No hay notificaciones sin leer'}
            </Typography>
          </Box>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAllIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              fullWidth={true}
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                minHeight: { xs: '40px', sm: 'auto' }
              }}
            >
              {window.innerWidth < 600 ? 'Leer todas' : 'Marcar todas como leídas'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<ClearAllIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
              onClick={clearAll}
              disabled={notifications.length === 0}
              fullWidth={true}
              sx={{ 
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                minHeight: { xs: '40px', sm: 'auto' }
              }}
            >
              {window.innerWidth < 600 ? 'Limpiar' : 'Limpiar todo'}
            </Button>
          </Stack>
        </Box>

        {/* Push Notifications Configuration */}
        {pushSupported && (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: { xs: 2, sm: 2.5 }, 
              mb: 3,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <PushIcon sx={{ color: 'primary.main', mt: 0.5 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Notificaciones Push
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Recibe notificaciones incluso cuando el administrador está cerrado. Te alertaremos sobre stock bajo, nuevas ventas y eventos importantes.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pushEnabled}
                        onChange={handlePushToggle}
                        disabled={pushLoading}
                      />
                    }
                    label={pushEnabled ? 'Activadas' : 'Desactivadas'}
                  />
                  {pushLoading && <CircularProgress size={20} />}
                  {pushEnabled && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleTestNotification}
                      sx={{ fontSize: '0.8rem' }}
                    >
                      Enviar prueba
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Tabs de filtro */}
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ 
            mb: 2,
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 90 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 }
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <span>Todas</span>
                {notifications.length > 0 && (
                  <Chip label={notifications.length} size="small" sx={{ height: { xs: 18, sm: 24 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <span>Alertas</span>
                {notifications.filter(n => n.type === 'warning').length > 0 && (
                  <Chip 
                    label={notifications.filter(n => n.type === 'warning').length} 
                    size="small" 
                    color="warning"
                    sx={{ height: { xs: 18, sm: 24 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <span>Errores</span>
                {notifications.filter(n => n.type === 'error').length > 0 && (
                  <Chip 
                    label={notifications.filter(n => n.type === 'error').length} 
                    size="small" 
                    color="error"
                    sx={{ height: { xs: 18, sm: 24 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  />
                )}
              </Box>
            } 
          />
          <Tab label="Éxitos" />
          <Tab label="Info" />
        </Tabs>

        {/* Lista de notificaciones */}
        {filteredNotifications.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay notificaciones en esta categoría
          </Alert>
        ) : (
          <List>
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: 1,
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 1, sm: 1.5 },
                    cursor: notification.actionUrl ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: notification.read ? 'action.hover' : 'action.selected',
                    },
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      size="small"
                      sx={{ mr: { xs: -1, sm: 0 } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${notification.type}.main`,
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 }
                      }}
                    >
                      {getIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ pr: { xs: 4, sm: 5 } }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography
                          variant="body1"
                          component="span"
                          fontWeight={notification.read ? 400 : 600}
                          sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}
                        >
                          {notification.message}
                        </Typography>
                        {!notification.read && (
                          <Chip 
                            label="Nuevo" 
                            color="primary" 
                            size="small"
                            sx={{ 
                              height: { xs: 18, sm: 24 },
                              fontSize: { xs: '0.65rem', sm: '0.75rem' }
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography component="span" sx={{ display: 'block' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: { xs: 0.5, sm: 1 }, 
                          flexWrap: 'wrap',
                          mb: notification.actionUrl ? 1 : 0
                        }}>
                          {notification.category && (
                            <Chip
                              icon={getCategoryIcon(notification.category)}
                              label={notification.category}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: { xs: 20, sm: 24 },
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                '& .MuiChip-icon': {
                                  fontSize: { xs: '0.9rem', sm: '1rem' }
                                }
                              }}
                            />
                          )}
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            component="span"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          >
                            {getRelativeTime(notification.timestamp)}
                          </Typography>
                        </Box>
                        {notification.actionUrl && (
                          <Button
                            size="small"
                            sx={{ 
                              mt: 0.5,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              px: { xs: 1, sm: 2 }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          >
                            {notification.actionLabel || 'Ver más'}
                          </Button>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < filteredNotifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Notifications;
