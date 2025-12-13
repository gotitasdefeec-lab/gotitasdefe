import React, { useEffect, useMemo, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
  MoreVert,
  Warning,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Bar } from 'react-chartjs-2';
import { useAutoNotifications } from '../hooks/useAutoNotifications';
import {
  salesApi,
  productsApi,
  categoriesApi,
  inventoryApi
} from '../services/api'; // <-- USAR EL SDK DE LA API
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
);

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  borderRadius: 20,
  background: theme.palette.mode === 'dark'
    ? 'rgba(49,46,129,0.55)'
    : 'rgba(255,255,255,0.55)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  backdropFilter: 'blur(16px)',
  border: '1.5px solid rgba(255,255,255,0.12)',
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: '0 16px 40px 0 rgba(99,102,241,0.18)',
    transform: 'translateY(-2px) scale(1.03)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '110px',
    height: '110px',
    background: `radial-gradient(circle, ${theme.palette.primary.light}22, transparent 70%)`,
    transform: 'translate(30%, -30%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  '& .MuiCardContent-root': {
    position: 'relative',
    zIndex: 2,
  },
}));

const Dashboard = () => {
  useAutoNotifications();

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, productsRes, inventoryRes, categoriesRes] = await Promise.all([
          salesApi.getAll(),
          productsApi.getAll(),
          inventoryApi.getAll(),
          categoriesApi.getAll(),
        ]);
        setOrders(ordersRes?.data || []);
        setProducts(productsRes?.data || []);
        setInventory(inventoryRes?.data || []);
        setCategories(categoriesRes?.data || []);
      } catch (e) {
        // handle error
      }
    };
    loadData();
  }, []);

  // Ventas por día (últimos 7 días)
  const salesData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const buckets = new Array(7).fill(0);
    for (const o of orders) {
      // Excluir pedidos cancelados y reembolsados
      const status = String(o.status || '').toLowerCase();
      const isCancelledOrRefunded = status === 'cancelled' || status === 'canceled' || status === 'refunded';
      if (isCancelledOrRefunded) continue;
      
      if (!o.date) continue;
      const d = new Date(o.date);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const idx = (now.getDay() - diffDays + 7) % 7; // mapear al día de la semana
        buckets[idx] += Number(o.total) || 0;
      }
    }
    return {
      labels: days,
      datasets: [
        {
          label: 'Ventas Diarias',
          data: buckets,
          fill: true,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: '#2196f3',
          tension: 0.4,
        },
      ],
    };
  }, [orders]);

  // Ventas por categoría (conteo de ítems por categoría)
  const categoryData = useMemo(() => {
    const productById = new Map(products.map((p) => [Number(p.id), p]));
    const countByCategory = new Map<string, number>();
    for (const o of orders) {
      for (const it of (o.items || [])) {
        const prod = productById.get(Number(it.productId));
        const cat = (prod?.category as string) || 'Otros';
        countByCategory.set(cat, (countByCategory.get(cat) || 0) + Number(it.quantity || 0));
      }
    }
    const labels = (categories.length ? categories.map((c) => c.name) : Array.from(countByCategory.keys()));
    const data = labels.map((l) => countByCategory.get(l) || 0);
    return {
      labels,
      datasets: [
        {
          label: 'Ventas por Categoría',
          data,
          backgroundColor: ['#2196f3', '#ff9800', '#4caf50', '#f44336', '#9c27b0', '#00bcd4', '#8bc34a'],
        },
      ],
    };
  }, [orders, products, categories]);

  // Órdenes recientes (últimas 5)
  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    return sorted.slice(0, 5).map(o => ({ id: o.id, customer: o.customerName || 'Cliente', amount: o.total, status: o.status }));
  }, [orders]);

  // Stock bajo: usa inventory si existe; si no, cae al stock del producto. minStock por producto (o 10 por defecto)
  const lowStockItems = useMemo(() => {
    const invMap = new Map<number, number>(
      inventory.map((r: any) => [Number(r.productId), Number(r.quantity) || 0])
    );
    const list = products.map((p: any) => {
      const pid = Number(p.id);
      const quantity = invMap.has(pid) ? (invMap.get(pid) as number) : (Number(p.stock) || 0);
      const minStock = Number((p as any).minStock) || 10;
      return { id: pid, name: String(p.name || `Producto ${pid}`), stock: quantity, minStock };
    });
    return list.filter((i) => i.stock < i.minStock).slice(0, 6);
  }, [inventory, products]);

  // KPIs principales
  const { totalSales, newOrders, activeCustomers, activeProducts } = useMemo(() => {
    const now = new Date();
    let totalSales7 = 0;
    let orders7 = 0;
    const customers = new Set<string>();
    for (const o of orders) {
      // Excluir pedidos cancelados y reembolsados del cálculo de ventas
      const status = String(o.status || '').toLowerCase();
      const isCancelledOrRefunded = status === 'cancelled' || status === 'canceled' || status === 'refunded';
      
      const total = Number(o.total) || 0;
      const d = o.date ? new Date(o.date) : null;
      if (d) {
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          // Solo sumar ventas si NO está cancelado o reembolsado
          if (!isCancelledOrRefunded) {
            totalSales7 += total;
          }
          orders7 += 1;
        }
      }
      if (o.customerName) customers.add(String(o.customerName));
    }
    return {
      totalSales: totalSales7,
      newOrders: orders7,
      activeCustomers: customers.size,
      activeProducts: products.length,
    };
  }, [orders, products.length]);

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: { xs: 2, sm: 3, md: 3 },
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontWeight: 800,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.01em',
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }}>
        {/* Tarjetas de estadísticas */}
  <Grid item xs={6} sm={6} md={3} lg={3} xl={3}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: { xs: 120, sm: 140, md: 160 }, 
                gap: { xs: 0.5, sm: 1 } 
              }}>
                <Box sx={{
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 0.5, sm: 1, md: 1.5 },
                  boxShadow: '0 2px 8px 0 rgba(99,102,241,0.15)',
                }}>
                  <AttachMoney sx={{ color: '#fff', fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  }}
                >
                  Ventas Totales
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 0.5, 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    textAlign: 'center', 
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
                  }}
                >
                  ${totalSales.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp color="success" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  <Typography 
                    variant="body2" 
                    color="success.main" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } 
                    }}
                  >
                    +15.3%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3} lg={3} xl={3}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: { xs: 120, sm: 140, md: 160 }, 
                gap: { xs: 0.5, sm: 1 } 
              }}>
                <Box sx={{
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 0.5, sm: 1, md: 1.5 },
                  boxShadow: '0 2px 8px 0 rgba(236,72,153,0.15)',
                }}>
                  <ShoppingCart sx={{ color: '#fff', fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  }}
                >
                  Pedidos Nuevos
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 0.5, 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    textAlign: 'center', 
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
                  }}
                >
                  {newOrders}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp color="success" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  <Typography 
                    variant="body2" 
                    color="success.main" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } 
                    }}
                  >
                    +8.4%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3} lg={3} xl={3}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: { xs: 120, sm: 140, md: 160 }, 
                gap: { xs: 0.5, sm: 1 } 
              }}>
                <Box sx={{
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 0.5, sm: 1, md: 1.5 },
                  boxShadow: '0 2px 8px 0 rgba(79,70,229,0.15)',
                }}>
                  <People sx={{ color: '#fff', fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  }}
                >
                  Clientes Activos
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 0.5, 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    textAlign: 'center', 
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
                  }}
                >
                  {activeCustomers.toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingDown color="error" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  <Typography 
                    variant="body2" 
                    color="error.main" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } 
                    }}
                  >
                    -2.5%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={6} sm={6} md={3} lg={3} xl={3}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: { xs: 120, sm: 140, md: 160 }, 
                gap: { xs: 0.5, sm: 1 } 
              }}>
                <Box sx={{
                  width: { xs: 36, sm: 42, md: 48 },
                  height: { xs: 36, sm: 42, md: 48 },
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 0.5, sm: 1, md: 1.5 },
                  boxShadow: '0 2px 8px 0 rgba(16,185,129,0.15)',
                }}>
                  <Inventory sx={{ color: '#fff', fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
                <Typography 
                  color="textSecondary" 
                  variant="subtitle2" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600, 
                    textAlign: 'center',
                    fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                  }}
                >
                  Productos Activos
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    mb: 0.5, 
                    fontWeight: 800, 
                    color: 'primary.main', 
                    textAlign: 'center', 
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' },
                  }}
                >
                  {activeProducts}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp color="success" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                  <Typography 
                    variant="body2" 
                    color="success.main" 
                    sx={{ 
                      fontWeight: 700, 
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } 
                    }}
                  >
                    +12.7%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Gráficas */}
  <Grid item xs={12} md={8} lg={8} xl={9}>
          <Card sx={{
            borderRadius: { xs: 12, sm: 16, md: 20 },
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(49,46,129,0.55)' : 'rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            transition: 'all 0.3s',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}>
                  Ventas de la Semana
                </Typography>
                <IconButton size="small">
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ height: { xs: 200, sm: 250, md: 300 } }}>
                <Line
                  data={salesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        display: true,
                        grid: {
                          display: true
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

  <Grid item xs={12} md={4} lg={4} xl={3}>
          <Card sx={{
            borderRadius: { xs: 12, sm: 16, md: 20 },
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(49,46,129,0.55)' : 'rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            transition: 'all 0.3s',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 2.5, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}>
                  Ventas por Categoría
                </Typography>
                <IconButton size="small">
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ height: { xs: 200, sm: 250, md: 300 } }}>
                <Bar
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Órdenes Recientes */}
  <Grid item xs={12} md={6} lg={6} xl={6}>
          <Card sx={{
            borderRadius: { xs: 12, sm: 16, md: 20 },
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(49,46,129,0.55)' : 'rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            transition: 'all 0.3s',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                Órdenes Recientes
              </Typography>
              <List sx={{ p: 0 }}>
                {recentOrders.map((order) => (
                  <ListItem
                    key={order.id}
                    secondaryAction={
                      <Chip
                        label={order.status}
                        color={
                          order.status === 'completed'
                            ? 'success'
                            : order.status === 'pending'
                            ? 'warning'
                            : 'info'
                        }
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      />
                    }
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 1, sm: 1.5 },
                      background: 'rgba(255,255,255,0.10)',
                      boxShadow: '0 2px 8px 0 rgba(99,102,241,0.07)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(99,102,241,0.10)',
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light', 
                        color: '#fff', 
                        fontWeight: 700,
                        width: { xs: 32, sm: 36, md: 40 },
                        height: { xs: 32, sm: 36, md: 40 },
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}>
                        {order.customer.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <span style={{ 
                          fontWeight: 600,
                          fontSize: window.innerWidth < 600 ? '0.85rem' : '1rem'
                        }}>
                          {order.customer}
                        </span>
                      }
                      secondary={
                        <span style={{ 
                          color: '#64748b',
                          fontSize: window.innerWidth < 600 ? '0.75rem' : '0.875rem'
                        }}>
                          ${order.amount}
                        </span>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas de Stock */}
  <Grid item xs={12} md={6} lg={6} xl={6}>
          <Card sx={{
            borderRadius: { xs: 12, sm: 16, md: 20 },
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(49,46,129,0.55)' : 'rgba(255,255,255,0.55)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            transition: 'all 0.3s',
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' },
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                Alertas de Stock Bajo
              </Typography>
              <List sx={{ p: 0 }}>
                {lowStockItems.map((item) => (
                  <ListItem 
                    key={item.id} 
                    sx={{ 
                      borderRadius: 2, 
                      mb: 1, 
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 1, sm: 1.5 },
                      background: 'rgba(255,255,255,0.10)', 
                      boxShadow: '0 2px 8px 0 rgba(99,102,241,0.07)', 
                      transition: 'all 0.2s', 
                      '&:hover': { 
                        background: 'rgba(253,186,116,0.13)', 
                        transform: 'scale(1.02)' 
                      } 
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: 'warning.light', 
                        color: '#fff', 
                        fontWeight: 700,
                        width: { xs: 32, sm: 36, md: 40 },
                        height: { xs: 32, sm: 36, md: 40 },
                      }}>
                        <Warning color="warning" fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <span style={{ 
                          fontWeight: 600,
                          fontSize: window.innerWidth < 600 ? '0.85rem' : '1rem'
                        }}>
                          {item.name}
                        </span>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(item.stock / item.minStock) * 100}
                            sx={{ 
                              flexGrow: 1, 
                              mr: { xs: 1, sm: 2 }, 
                              borderRadius: 2, 
                              height: { xs: 6, sm: 8 }, 
                              background: 'rgba(253,186,116,0.13)' 
                            }}
                            color="warning"
                          />
                          <Box 
                            component="span" 
                            sx={{ 
                              color: 'text.secondary', 
                              fontWeight: 600,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            {item.stock}/{item.minStock}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
