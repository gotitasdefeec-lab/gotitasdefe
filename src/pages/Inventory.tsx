import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  //Edit as EditIcon,
  //Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { inventoryApi, productsApi } from '../services/api';

interface InventoryItem {
  id: number;
  productId: number;
  product: string;
  sku: string;
  stock: number;
  minStock: number;
  maxStock: number;
  location: string;
  lastMovement: string;
  status: 'bajo' | 'normal' | 'exceso';
  category: string;
  supplier: string;
  movements: {
    date: string;
    type: 'entrada' | 'salida';
    quantity: number;
    reason: string;
  }[];
  stockHistory: {
    date: string;
    stock: number;
  }[];
}

async function revalidateStorefront(actions: string[], productId?: number) {
  const storefrontUrl = process.env.REACT_APP_STOREFRONT_URL || 'https://www.gotasdefe.com';
  const revalidationToken = process.env.REACT_APP_REVALIDATION_TOKEN;

  if (!revalidationToken) return;

  try {
    for (const action of actions) {
      await fetch(`${storefrontUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: revalidationToken, action, productId }),
      });
    }
  } catch (error) {
    console.error('❌ No se pudo revalidar storefront desde inventario:', error);
  }
}

const Inventory = () => {
  // Exportar inventario a CSV
  const exportToCSV = () => {
    const headers = [
      'SKU', 'Producto', 'Stock', 'MinStock', 'MaxStock', 'Ubicación', 'Categoría', 'Proveedor'
    ];
    const rows = (inventory || []).map((item: InventoryItem) => [
      item.sku,
      item.product,
      item.stock,
      item.minStock,
      item.maxStock,
      item.location,
      item.category,
      item.supplier
    ]);
    const csvContent = [headers, ...rows]
      .map((row: any[]) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [movementType, setMovementType] = useState<'entrada' | 'salida'>('entrada');
  const [movementQty, setMovementQty] = useState<number>(0);
  const [movementReason, setMovementReason] = useState('');
  const [movementLoading, setMovementLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [sortBy, setSortBy] = useState<'stockDesc' | 'stockAsc' | 'recentMovement'>('stockDesc');
  // Estado de nuevo item removido

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, prodRes] = await Promise.all([
          inventoryApi.getAll(),
          productsApi.getAll(),
        ]);
        // El backend NestJS devuelve directamente el array, no encapsulado en data
        const productsData = Array.isArray(prodRes) ? prodRes : (prodRes.data || []);
        const inventoryData = Array.isArray(invRes) ? invRes : (invRes.data || []);
        
        const products = productsData.map((p: any) => ({
          id: Number(p.id),
          name: p.name as string,
          sku: p.sku as string,
          category: (p.category as string) || 'General',
        }));
        const items: InventoryItem[] = inventoryData.map((row: any) => {
          const prod = products.find((p: any) => p.id === Number(row.productId));
          const stock = Number(row.quantity) || 0;
          const minStock = 10;
          const maxStock = 100;
          let status: InventoryItem['status'] = 'normal';
          if (stock < minStock) status = 'bajo';
          if (stock > maxStock) status = 'exceso';
          
          // Parsear movements y stockHistory del backend
          const movements = Array.isArray(row.movements) ? row.movements : [];
          const stockHistory = Array.isArray(row.stockHistory) ? row.stockHistory : [];
          
          return {
            id: Number(row.id),
            productId: Number(row.productId),
            product: prod?.name || `Producto ${row.productId}`,
            sku: prod?.sku || `SKU-${row.productId}`,
            stock,
            minStock,
            maxStock,
            location: row.location || 'Almacén',
            lastMovement: row.lastMovement ? new Date(row.lastMovement).toLocaleDateString('es-ES') : '',
            status,
            category: prod?.category || 'General',
            supplier: 'Proveedor Demo',
            movements: movements,
            stockHistory: stockHistory,
          };
        });
        setInventory(items);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar inventario');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const categories = [...new Set(inventory.map((item: InventoryItem) => item.category))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bajo':
        return 'error';
      case 'normal':
        return 'success';
      case 'exceso':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'bajo':
        return 'Stock Bajo';
      case 'normal':
        return 'Normal';
      case 'exceso':
        return 'Exceso';
      default:
        return status;
    }
  };

  const filteredInventory = inventory.filter((item: InventoryItem) => {
    const matchesSearch = 
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedInventory = [...filteredInventory].sort((a: InventoryItem, b: InventoryItem) => {
    if (sortBy === 'stockDesc') return b.stock - a.stock;
    if (sortBy === 'stockAsc') return a.stock - b.stock;
    const ad = a.lastMovement ? new Date(a.lastMovement).getTime() : 0;
    const bd = b.lastMovement ? new Date(b.lastMovement).getTime() : 0;
    return bd - ad;
  });

  const renderInventoryStats = () => (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                >
                  Total de Productos
                </Typography>
                <Typography 
                  variant="h4"
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
                >
                  {inventory.length}
                </Typography>
              </Box>
              <InventoryIcon color="primary" sx={{ fontSize: { xs: 28, sm: 36, md: 40 } }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                >
                  Stock Bajo
                </Typography>
                <Typography 
                  variant="h4" 
                  color="error"
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
                >
                  {inventory.filter((item: InventoryItem) => item.status === 'bajo').length}
                </Typography>
              </Box>
              <WarningIcon color="error" sx={{ fontSize: { xs: 28, sm: 36, md: 40 } }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                >
                  Stock Normal
                </Typography>
                <Typography 
                  variant="h4" 
                  color="success"
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
                >
                  {inventory.filter((item: InventoryItem) => item.status === 'normal').length}
                </Typography>
              </Box>
              <TrendingUpIcon color="success" sx={{ fontSize: { xs: 28, sm: 36, md: 40 } }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography 
                  color="textSecondary" 
                  gutterBottom
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                >
                  Stock en Exceso
                </Typography>
                <Typography 
                  variant="h4" 
                  color="warning"
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
                >
                  {inventory.filter((item: InventoryItem) => item.status === 'exceso').length}
                </Typography>
              </Box>
              <TrendingDownIcon color="warning" sx={{ fontSize: { xs: 28, sm: 36, md: 40 } }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderInventoryAlerts = () => (
    <Box sx={{ mb: 3 }}>
  {inventory.filter((item: InventoryItem) => item.status === 'bajo').length > 0 && (
        <Alert 
          severity="warning" 
          action={
            <Button color="inherit" size="small">
              Ver Detalles
            </Button>
          }
        >
          {inventory.filter((item: InventoryItem) => item.status === 'bajo').length} productos están por debajo del stock mínimo
        </Alert>
      )}
    </Box>
  );

  const renderInventoryTable = () => (
    <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <Table sx={{ minWidth: { xs: 650, sm: 750 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 }
            }}>
              SKU
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 }
            }}>
              Producto
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 }
            }}>
              Stock Actual
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 },
              display: { xs: 'none', sm: 'table-cell' }
            }}>
              Mín/Máx
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 },
              display: { xs: 'none', md: 'table-cell' }
            }}>
              Ubicación
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 },
              display: { xs: 'none', md: 'table-cell' }
            }}>
              Último Movimiento
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 }
            }}>
              Estado
            </TableCell>
            <TableCell sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 1, sm: 2 }
            }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedInventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}>
                {item.sku}
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                <Box>
                  <Typography 
                    variant="subtitle2"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    {item.product}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    {item.supplier}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  {item.stock}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(item.stock / item.maxStock) * 100}
                  color={getStatusColor(item.status) as any}
                  sx={{ height: { xs: 3, sm: 4 }, borderRadius: 2 }}
                />
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'table-cell' }
              }}>
                {item.minStock} / {item.maxStock}
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                {item.location}
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                {item.lastMovement}
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                <Chip
                  label={getStatusLabel(item.status)}
                  color={getStatusColor(item.status) as any}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: 20, sm: 24 }
                  }}
                />
              </TableCell>
              <TableCell sx={{ 
                py: { xs: 0.75, sm: 1.5 },
                px: { xs: 0.5, sm: 2 }
              }}>
                <Tooltip title="Registrar Movimiento">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setCurrentItem(item);
                      setMovementDialogOpen(true);
                    }}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <RefreshIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Ver Historial">
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setCurrentItem(item);
                      setDialogOpen(true);
                      setTabValue(1);
                    }}
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <HistoryIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const handleRegisterMovement = async () => {
    if (!currentItem) return;
    if (!movementQty || movementQty <= 0) {
      setSnackbar({ open: true, message: 'Cantidad inválida', severity: 'error' });
      return;
    }
    setMovementLoading(true);
    try {
      await inventoryApi.registerMovement(currentItem.id, {
        type: movementType,
        quantity: movementQty,
        reason: movementReason,
      });
      // Optimistic UI update with additional fields
      const now = new Date().toISOString();
      let newStock = currentItem.stock + (movementType === 'entrada' ? movementQty : -movementQty);
      if (newStock < 0) newStock = 0;
  setInventory((prev: InventoryItem[]) => prev.map((item: InventoryItem) =>
        item.id === currentItem.id
          ? {
              ...item,
              stock: newStock,
              lastMovement: now,
              movements: [
                ...item.movements,
                { date: now, type: movementType, quantity: movementQty, reason: movementReason },
              ],
              stockHistory: [...item.stockHistory, { date: now, stock: newStock }],
            }
          : item
      ));
      setSnackbar({ open: true, message: 'Movimiento registrado correctamente', severity: 'success' });
      revalidateStorefront(['products', 'featured-products'], currentItem.productId);
      setMovementDialogOpen(false);
      setMovementQty(0);
      setMovementReason('');
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Error al registrar movimiento', severity: 'error' });
    } finally {
      setMovementLoading(false);
    }
  };

  const renderMovementDialog = () => (
    <Dialog 
      open={movementDialogOpen} 
      onClose={() => setMovementDialogOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          mx: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' }
        }
      }}
    >
      <DialogTitle sx={{ 
        fontSize: { xs: '1.1rem', sm: '1.25rem' },
        pb: { xs: 1, sm: 2 }
      }}>
        Registrar Movimiento de Inventario
      </DialogTitle>
      <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <Typography 
              variant="subtitle2" 
              gutterBottom
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Producto: {currentItem?.product}
            </Typography>
            <Typography 
              variant="body2" 
              color="textSecondary" 
              gutterBottom
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Stock Actual: {currentItem?.stock}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Tipo de Movimiento
              </InputLabel>
              <Select
                label="Tipo de Movimiento"
                value={movementType}
                onChange={(e: SelectChangeEvent<'entrada' | 'salida'>) => setMovementType(e.target.value as 'entrada' | 'salida')}
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Cantidad"
              type="number"
              value={movementQty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMovementQty(Number(e.target.value))}
              inputProps={{ min: 1 }}
              sx={{
                '& input': { fontSize: { xs: '0.9rem', sm: '1rem' } },
                '& label': { fontSize: { xs: '0.9rem', sm: '1rem' } }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Motivo"
              multiline
              rows={2}
              value={movementReason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMovementReason(e.target.value)}
              sx={{
                '& textarea': { fontSize: { xs: '0.9rem', sm: '1rem' } },
                '& label': { fontSize: { xs: '0.9rem', sm: '1rem' } }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ 
        px: { xs: 2, sm: 3 },
        pb: { xs: 2, sm: 3 }
      }}>
        <Button 
          onClick={() => setMovementDialogOpen(false)} 
          disabled={movementLoading}
          sx={{ 
            minHeight: { xs: 36, sm: 42 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained"
          onClick={handleRegisterMovement}
          disabled={movementLoading}
        >
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderHistoryDialog = () => (
    <Dialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{currentItem?.product} - Historial</DialogTitle>
      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={(_: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Movimientos" />
          <Tab label="Gráfico de Stock" />
        </Tabs>

        {tabValue === 0 && currentItem && (
          <Box>
            {currentItem.movements.length === 0 ? (
              <Alert severity="info">No hay movimientos registrados</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentItem.movements.map((movement: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(movement.date).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={movement.type === 'entrada' ? 'Entrada' : 'Salida'}
                          color={movement.type === 'entrada' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={movement.type === 'entrada' ? 'success.main' : 'error.main'}
                        >
                          {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>{movement.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {tabValue === 1 && currentItem && (
          <Box sx={{ height: 300 }}>
            {currentItem.stockHistory.length === 0 ? (
              <Alert severity="info">No hay historial de stock disponible</Alert>
            ) : (
              <Line
                data={{
                  labels: currentItem.stockHistory.map((h: any) =>
                    new Date(h.date).toLocaleDateString('es-ES', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  ),
                  datasets: [
                    {
                      label: 'Stock',
                      data: currentItem.stockHistory.map((h: any) => h.stock),
                      fill: false,
                      borderColor: '#2196f3',
                      tension: 0.4,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                    },
                    {
                      label: 'Stock Mínimo',
                      data: currentItem.stockHistory.map(() => currentItem.minStock),
                      fill: false,
                      borderColor: '#f44336',
                      borderDash: [5, 5],
                      pointRadius: 0,
                    },
                    {
                      label: 'Stock Máximo',
                      data: currentItem.stockHistory.map(() => currentItem.maxStock),
                      fill: false,
                      borderColor: '#4caf50',
                      borderDash: [5, 5],
                      pointRadius: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Cantidad',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Fecha',
                      },
                    },
                  },
                }}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );

  // Diálogo y creación de nuevo item removidos

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 }, 
        gap: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Typography variant="h4" sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontWeight: 600
        }}>
          Inventario
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
            onClick={exportToCSV}
            sx={{ 
              minHeight: { xs: 36, sm: 42 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              flex: { xs: '1 1 auto', sm: '0 0 auto' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Exportar CSV</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>CSV</Box>
          </Button>
          <Button
            component={RouterLink}
            to="/products"
            variant="outlined"
            size="small"
            color="primary"
            sx={{ 
              minHeight: { xs: 36, sm: 42 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              flex: { xs: '1 1 auto', sm: '0 0 auto' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Ir a Productos</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Productos</Box>
          </Button>
          {/* Botón Nuevo Item removido por redundancia con sección Productos */}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 1.5, sm: 2 } }}>{error}</Alert>
      )}

      {renderInventoryStats()}
      {renderInventoryAlerts()}

      <Box sx={{ 
        mb: { xs: 2, sm: 3 }, 
        display: 'flex', 
        gap: { xs: 1, sm: 2 }, 
        flexWrap: 'wrap' 
      }}>
        <TextField
          placeholder="Buscar..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            flexGrow: 1, 
            minWidth: { xs: '100%', sm: 200 },
            maxWidth: { xs: '100%', sm: 300 },
            '& input': { fontSize: { xs: '0.9rem', sm: '1rem' } }
          }}
        />

        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
          onClick={(e: React.MouseEvent<HTMLElement>) => setFilterAnchorEl(e.currentTarget)}
          sx={{ 
            minHeight: { xs: 36, sm: 42 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          Filtrar
        </Button>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
        >
          <MenuItem onClick={() => setSelectedCategory('all')}>
            Todas las categorías
          </MenuItem>
          {categories.map((category) => (
            <MenuItem
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setFilterAnchorEl(null);
              }}
            >
              {category}
            </MenuItem>
          ))}
        </Menu>

        <Button
          variant="outlined"
          size="small"
          startIcon={<SortIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
          onClick={(e: React.MouseEvent<HTMLElement>) => setSortAnchorEl(e.currentTarget)}
          sx={{ 
            minHeight: { xs: 36, sm: 42 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          Ordenar
        </Button>
        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={() => setSortAnchorEl(null)}
        >
          <MenuItem onClick={() => { setSortBy('stockDesc'); setSortAnchorEl(null); }}>
            Stock (Mayor a Menor)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('stockAsc'); setSortAnchorEl(null); }}>
            Stock (Menor a Mayor)
          </MenuItem>
          <MenuItem onClick={() => { setSortBy('recentMovement'); setSortAnchorEl(null); }}>
            Últimos Movimientos
          </MenuItem>
        </Menu>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography>Cargando inventario…</Typography>
        </Paper>
      ) : (
        renderInventoryTable()
      )}
      {renderMovementDialog()}
      {renderHistoryDialog()}
  {/* Diálogo de Nuevo Item removido por redundancia */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;