import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { customersApi } from '../services/api';
import { Customer, CreateCustomerData, UpdateCustomerData } from '../types/customers';

const validationSchema = yup.object({
  name: yup.string().required('El nombre es requerido'),
  cedula: yup
    .string()
    .trim()
    .matches(/^\d{10}$/,
      'La cédula debe tener 10 dígitos numéricos')
    .optional(),
  email: yup.string().email('Email inválido').required('El email es requerido'),
  phone: yup.string().required('El teléfono es requerido'),
  address: yup.string().required('La dirección es requerida'),
  city: yup.string(),
  postalCode: yup.string(),
  country: yup.string(),
  notes: yup.string(),
});

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      cedula: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Ecuador',
      notes: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (editingCustomer) {
          const updateData: UpdateCustomerData = {
            id: editingCustomer.id,
            ...values,
          };
          await customersApi.update(editingCustomer.id, updateData);
          setSnackbar({ open: true, message: 'Cliente actualizado correctamente', severity: 'success' });
        } else {
          const createData: CreateCustomerData = values;
          await customersApi.create(createData);
          setSnackbar({ open: true, message: 'Cliente creado correctamente', severity: 'success' });
        }
        await fetchCustomers();
        handleCloseDialog();
      } catch (error: any) {
        // Detectar errores específicos de campos únicos
        let errorMessage = error?.message || 'Error al guardar el cliente';
        
        if (errorMessage.includes('Unique constraint failed') && errorMessage.includes('email')) {
          errorMessage = '⚠️ Este email ya está registrado. Por favor usa un email diferente.';
        } else if (errorMessage.includes('Unique constraint failed') && errorMessage.includes('cedula')) {
          errorMessage = '⚠️ Esta cédula ya está registrada. Por favor verifica el número.';
        } else if (errorMessage.includes('Unique constraint failed')) {
          errorMessage = '⚠️ Ya existe un cliente con estos datos. Verifica email y cédula.';
        }
        
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersApi.getAll();
      // El backend NestJS devuelve directamente el array, no encapsulado en data
      const customersData = Array.isArray(response) ? response : (response.data || []);
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al cargar los clientes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.cedula && customer.cedula.includes(searchTerm)) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      formik.setValues({
        name: customer.name,
        cedula: customer.cedula || '',
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'Ecuador',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    formik.resetForm();
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setLoading(true);
      await customersApi.delete(customerToDelete.id);
      await fetchCustomers();
      setSnackbar({ open: true, message: 'Cliente eliminado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al eliminar el cliente', severity: 'error' });
    } finally {
      setLoading(false);
      setOpenDeleteDialog(false);
      setCustomerToDelete(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getCustomerStats = (customer: Customer) => {
    return {
      totalPurchases: customer.totalPurchases || 0,
      lastPurchase: customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : 'Nunca',
    };
  };

  const getRegistrationDate = (customer: Customer) => {
    return customer.registrationDate || customer.createdAt || new Date().toISOString();
  };

  return (
    <Container maxWidth={false} sx={{ px: 0 }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {/* Encabezado */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 }
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              fontWeight: 600,
              mb: { xs: 0, sm: 1 }
            }}
          >
            Gestión de Clientes
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              borderRadius: 2,
              minHeight: { xs: 36, sm: 42 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              alignSelf: { xs: 'flex-start', sm: 'auto' }
            }}
          >
            Nuevo Cliente
          </Button>
        </Box>

        {/* Barra de búsqueda */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              borderRadius: 2,
              '& input': { fontSize: { xs: '0.9rem', sm: '1rem' } }
            }}
          />
        </Box>

        {/* Tabla de clientes */}
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
          <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
            <Table stickyHeader sx={{ minWidth: { xs: 650, sm: 750 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600
                  }}>
                    Cliente
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600,
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    Cédula
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600
                  }}>
                    Contacto
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    Ubicación
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600,
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    Estadísticas
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'table-cell' }
                  }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 1, sm: 2 },
                    fontWeight: 600,
                    display: { xs: 'none', md: 'table-cell' }
                  }}>
                    Fecha Registro
                  </TableCell>
                  <TableCell align="center" sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 },
                    px: { xs: 0.5, sm: 2 },
                    fontWeight: 600
                  }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer);
                  return (
                    <TableRow key={customer.id} hover>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                            >
                              {customer.name}
                            </Typography>
                            {customer.notes && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  display: { xs: 'none', sm: 'block' }
                                }}
                              >
                                {customer.notes}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        display: { xs: 'none', md: 'table-cell' }
                      }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {customer.cedula || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 }
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon 
                              fontSize="small" 
                              color="action" 
                              sx={{ fontSize: { xs: '0.9rem', sm: '1.125rem' }, display: { xs: 'none', sm: 'block' } }} 
                            />
                            <Typography 
                              variant="body2"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {customer.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon 
                              fontSize="small" 
                              color="action" 
                              sx={{ fontSize: { xs: '0.9rem', sm: '1.125rem' }, display: { xs: 'none', sm: 'block' } }} 
                            />
                            <Typography 
                              variant="body2"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {customer.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon 
                            fontSize="small" 
                            color="action" 
                            sx={{ fontSize: { xs: '0.9rem', sm: '1.125rem' } }} 
                          />
                          <Box>
                            <Typography 
                              variant="body2"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {customer.city || customer.address}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                            >
                              {customer.country || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        display: { xs: 'none', md: 'table-cell' }
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography 
                            variant="body2"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            Total: ${stats.totalPurchases.toFixed(2)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                          >
                            Última: {stats.lastPurchase}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        <Chip
                          label={customer.status === 'active' ? 'Activo' : customer.status === 'inactive' ? 'Inactivo' : 'Activo'}
                          color={customer.status === 'inactive' ? 'default' : 'success'}
                          size="small"
                          sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            height: { xs: 20, sm: 24 }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 1, sm: 2 },
                        display: { xs: 'none', md: 'table-cell' }
                      }}>
                        <Typography 
                          variant="body2"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {formatDate(getRegistrationDate(customer))}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ 
                        py: { xs: 0.75, sm: 1.5 },
                        px: { xs: 0.5, sm: 2 }
                      }}>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, customer)}
                          size="small"
                          sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                          <MoreVertIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          py: { xs: 3, sm: 4 },
                          fontSize: { xs: '0.85rem', sm: '0.875rem' }
                        }}
                      >
                        {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Menú de acciones */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedCustomer) handleOpenDialog(selectedCustomer);
            handleMenuClose();
          }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedCustomer) {
              setCustomerToDelete(selectedCustomer);
              setOpenDeleteDialog(true);
            }
            handleMenuClose();
          }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        </Menu>

        {/* Dialog para crear/editar cliente */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle>
            {editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <TextField
                  fullWidth
                  name="name"
                  label="Nombre completo"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
                <TextField
                  fullWidth
                  name="cedula"
                  label="Cédula"
                  value={formik.values.cedula}
                  onChange={formik.handleChange}
                  error={formik.touched.cedula && Boolean(formik.errors.cedula)}
                  helperText={formik.touched.cedula && formik.errors.cedula}
                />
                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                  fullWidth
                  name="phone"
                  label="Teléfono"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
                <TextField
                  fullWidth
                  name="city"
                  label="Ciudad"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                />
                <TextField
                  fullWidth
                  name="postalCode"
                  label="Código Postal"
                  value={formik.values.postalCode}
                  onChange={formik.handleChange}
                  error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                  helperText={formik.touched.postalCode && formik.errors.postalCode}
                />
                <TextField
                  fullWidth
                  name="country"
                  label="País"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  error={formik.touched.country && Boolean(formik.errors.country)}
                  helperText={formik.touched.country && formik.errors.country}
                />
              </Box>
              <TextField
                fullWidth
                name="address"
                label="Dirección completa"
                value={formik.values.address}
                onChange={formik.handleChange}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                name="notes"
                label="Notas adicionales"
                multiline
                rows={3}
                value={formik.values.notes}
                onChange={formik.handleChange}
                sx={{ mt: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={formik.submitForm}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {editingCustomer ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de confirmación para eliminar */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar al cliente "{customerToDelete?.name}"?
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteCustomer}
              disabled={loading}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
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
    </Container>
  );
};

export default Customers;