import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  CalendarToday,
  TrendingUp,
  ShoppingCart,
  Inventory,
  Phone as PhoneIcon,
  BadgeOutlined,
  DeleteOutline as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { salesApi } from '../services/api';
import { changeAdminPassword, verifyAdminPassword } from '../services/authService';

interface ProfileStats {
  totalSales: number;
  totalRevenue: number;
  productsManaged: number;
  lastLogin: string;
  accountCreated: string;
}

const Profile = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [isCurrentPasswordValid, setIsCurrentPasswordValid] = useState<boolean | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    totalSales: 0,
    totalRevenue: 0,
    productsManaged: 0,
    lastLogin: new Date().toLocaleDateString('es-ES'),
    accountCreated: '15/01/2024',
  });
  const [loading, setLoading] = useState(false);

  // Cargar estadísticas reales
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await salesApi.getAll();
        const salesData = response.data || [];
        const totalSales = salesData.length;
        const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
        
        setProfileStats({
          totalSales,
          totalRevenue,
          productsManaged: 45, // Esto lo puedes obtener de productsApi si quieres
          lastLogin: new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          accountCreated: '15 de enero de 2024',
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, []);

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .required('El nombre es obligatorio'),
    email: Yup.string()
      .email('Email inválido')
      .required('El email es obligatorio'),
    phone: Yup.string()
      .matches(/^[0-9+\-\s()]*$/, 'Teléfono inválido'),
    bio: Yup.string()
      .max(200, 'La biografía no puede exceder 200 caracteres'),
  });

  const formik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
      avatar: currentUser?.avatar || '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Actualizar el usuario en el contexto
        if (setCurrentUser && currentUser) {
          const updatedUser = {
            ...currentUser,
            ...values,
          };
          setCurrentUser(updatedUser);
          
          // Guardar en localStorage
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }

        setSuccessMessage('✅ Perfil actualizado correctamente');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error) {
        setErrorMessage('❌ Error al actualizar el perfil');
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        setLoading(false);
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('La contraseña actual es obligatoria'),
      newPassword: Yup.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .required('La nueva contraseña es obligatoria'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
        .required('Confirma la nueva contraseña'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        // Llamar al backend real para cambiar la contraseña
        if (!currentUser?.email) {
          throw new Error('No se encontró el email del usuario');
        }
        
        await changeAdminPassword(currentUser.email, values.currentPassword, values.newPassword, values.confirmPassword);
        
        setSuccessMessage('✅ Contraseña cambiada correctamente');
        setOpenPasswordDialog(false);
        resetForm();
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error: any) {
        setErrorMessage(`❌ ${error.message || 'Error al cambiar la contraseña'}`);
        setTimeout(() => setErrorMessage(''), 5000);
      } finally {
        setLoading(false);
      }
    },
  });

  // Verificar contraseña actual en tiempo real con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const password = passwordFormik.values.currentPassword;
      if (!password || password.length < 6) {
        setIsCurrentPasswordValid(null);
        return;
      }

      if (!currentUser?.email) return;

      const verifyPassword = async () => {
        setIsVerifyingPassword(true);
        try {
          const isValid = await verifyAdminPassword(currentUser.email, password);
          setIsCurrentPasswordValid(isValid);
        } catch (error) {
          setIsCurrentPasswordValid(false);
        } finally {
          setIsVerifyingPassword(false);
        }
      };

      verifyPassword();
    }, 800); // Espera 800ms después de que el usuario deja de escribir

    return () => clearTimeout(timer);
  }, [passwordFormik.values.currentPassword, currentUser]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('❌ La imagen no puede superar los 2MB');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setErrorMessage('❌ Solo se permiten archivos de imagen');
        setTimeout(() => setErrorMessage(''), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        formik.setFieldValue('avatar', reader.result as string);
        setSuccessMessage('✅ Imagen cargada correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    formik.setFieldValue('avatar', '');
    setSuccessMessage('✅ Imagen eliminada');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCancel = () => {
    formik.resetForm();
    setIsEditing(false);
    setErrorMessage('');
  };

  useEffect(() => {
    if (currentUser) {
      formik.setValues({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        avatar: currentUser.avatar || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2 } }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Perfil Principal */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                src={formik.values.avatar}
                sx={{ 
                  width: { xs: 120, sm: 140, md: 150 }, 
                  height: { xs: 120, sm: 140, md: 150 }, 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem' },
                  bgcolor: formik.values.avatar ? 'transparent' : 'primary.main',
                }}
              >
                {!formik.values.avatar && formik.values.name.charAt(0).toUpperCase()}
              </Avatar>
              {isEditing && (
                <Box>
                  <IconButton
                    color="primary"
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: { xs: -4, sm: -8 },
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': { bgcolor: 'primary.main', color: 'white' },
                    }}
                    component="label"
                    title="Cambiar foto"
                  >
                    <input
                      hidden
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      type="file"
                      onChange={handleAvatarChange}
                    />
                    <PhotoCamera sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                  </IconButton>
                  {formik.values.avatar && (
                    <IconButton
                      color="error"
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: { xs: -4, sm: -8 },
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'error.main', color: 'white' },
                      }}
                      onClick={handleRemoveAvatar}
                      title="Eliminar foto"
                    >
                      <DeleteIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>

            <Typography 
              variant="h5" 
              gutterBottom 
              fontWeight="600"
              sx={{ fontSize: { xs: '1.25rem', sm: '1.35rem', md: '1.5rem' } }}
            >
              {formik.values.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 0.5,
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                wordBreak: 'break-all'
              }}
            >
              <EmailIcon fontSize="small" />
              {formik.values.email}
            </Typography>
            {formik.values.phone && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 0.5, 
                  mb: 1,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                <PhoneIcon fontSize="small" />
                {formik.values.phone}
              </Typography>
            )}
            <Chip 
              icon={<BadgeOutlined />}
              label={currentUser?.role === 'admin' ? 'Administrador' : 'Usuario'} 
              color="primary" 
              size="small"
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }}
            />

            <Divider sx={{ my: 2 }} />

            {formik.values.bio && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                {formik.values.bio}
              </Typography>
            )}

            {!isEditing ? (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  fullWidth
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    mb: 1,
                    minHeight: { xs: '40px', sm: '42px' }
                  }}
                >
                  Editar Perfil
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  fullWidth
                  onClick={() => setOpenPasswordDialog(true)}
                  sx={{ minHeight: { xs: '40px', sm: '42px' } }}
                >
                  Cambiar Contraseña
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  fullWidth
                  onClick={() => formik.handleSubmit()}
                  disabled={loading || !formik.isValid || !formik.dirty}
                  sx={{ 
                    mb: 1,
                    minHeight: { xs: '40px', sm: '42px' }
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  fullWidth
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ minHeight: { xs: '40px', sm: '42px' } }}
                >
                  Cancelar
                </Button>
              </Box>
            )}
          </Paper>

          {/* Estadísticas */}
          <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mt: { xs: 2, sm: 2.5, md: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              fontWeight="600"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' } }}
            >
              Estadísticas
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List disablePadding>
              <ListItem sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <ShoppingCart color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Ventas Totales
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="h6" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' } }}
                    >
                      {profileStats.totalSales}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <TrendingUp color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Ingresos
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      color="success.main"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' } }}
                    >
                      ${profileStats.totalRevenue.toFixed(2)}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <Inventory color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Productos Gestionados
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="h6" 
                      fontWeight="600"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' } }}
                    >
                      {profileStats.productsManaged}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
              <ListItem sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <CalendarToday color="info" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Último Acceso
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="body2" 
                      fontWeight="500"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {profileStats.lastLogin}
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Información del Perfil */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' }, 
              mb: 2,
              gap: { xs: 1, sm: 0 }
            }}>
              <Typography 
                variant="h6" 
                fontWeight="600"
                sx={{ fontSize: { xs: '1.1rem', sm: '1.15rem', md: '1.25rem' } }}
              >
                Información Personal
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{ 
                    minHeight: { xs: '36px', sm: '40px' },
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}
                >
                  Editar
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }} />

            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active', fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active', fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    disabled={!isEditing}
                    placeholder="Ej: +34 123 456 789"
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rol"
                    value={currentUser?.role || 'Administrador'}
                    disabled
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Biografía"
                    name="bio"
                    multiline
                    minRows={2}
                    value={formik.values.bio}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.bio && Boolean(formik.errors.bio)}
                    helperText={
                      (formik.touched.bio && formik.errors.bio) ||
                      `${formik.values.bio.length}/200 caracteres`
                    }
                    disabled={!isEditing}
                    placeholder="Cuéntanos algo sobre ti..."
                    sx={{
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Información Adicional */}
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minHeight: { xs: '140px', sm: '160px' }
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                  <Stack spacing={{ xs: 0.5, sm: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                      <ShoppingCart sx={{ mr: 1, fontSize: { xs: 24, sm: 28, md: 32 } }} />
                      <Typography 
                        variant="h6" 
                        color="white"
                        sx={{ fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}
                      >
                        Ventas Totales
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h3" 
                      color="white" 
                      fontWeight="700"
                      sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
                    >
                      {profileStats.totalSales}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Órdenes procesadas
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card sx={{ 
                height: '100%', 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                minHeight: { xs: '140px', sm: '160px' }
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                  <Stack spacing={{ xs: 0.5, sm: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                      <TrendingUp sx={{ mr: 1, fontSize: { xs: 24, sm: 28, md: 32 } }} />
                      <Typography 
                        variant="h6" 
                        color="white"
                        sx={{ fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}
                      >
                        Ingresos
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h3" 
                      color="white" 
                      fontWeight="700"
                      sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}
                    >
                      ${profileStats.totalRevenue.toFixed(0)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      Total generado
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Dialog para Cambiar Contraseña */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 3 },
            maxWidth: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 48px)' }
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Cambiar Contraseña
        </DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <TextField
              fullWidth
              type="password"
              label="Contraseña Actual"
              name="currentPassword"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={
                (passwordFormik.touched.currentPassword &&
                Boolean(passwordFormik.errors.currentPassword)) ||
                (isCurrentPasswordValid === false && passwordFormik.values.currentPassword.length > 0)
              }
              helperText={
                passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword
                  ? passwordFormik.errors.currentPassword
                  : isCurrentPasswordValid === true
                  ? '✓ Contraseña correcta'
                  : isCurrentPasswordValid === false
                  ? 'Contraseña incorrecta'
                  : 'Ingresa tu contraseña actual'
              }
              InputProps={{
                endAdornment: isVerifyingPassword ? (
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>Verificando...</span>
                ) : passwordFormik.values.currentPassword && (
                  isCurrentPasswordValid === true ? (
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  ) : isCurrentPasswordValid === false ? (
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  ) : null
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                },
                '& .MuiFormHelperText-root': {
                  color: isCurrentPasswordValid === true ? 'success.main' : isCurrentPasswordValid === false ? 'error.main' : undefined
                }
              }}
            />
            <TextField
              fullWidth
              type="password"
              label="Nueva Contraseña"
              name="newPassword"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={
                passwordFormik.touched.newPassword &&
                Boolean(passwordFormik.errors.newPassword)
              }
              helperText={
                passwordFormik.touched.newPassword 
                  ? passwordFormik.errors.newPassword || (passwordFormik.values.newPassword.length >= 6 ? '✓ Contraseña válida' : '')
                  : 'Mínimo 6 caracteres'
              }
              InputProps={{
                endAdornment: passwordFormik.values.newPassword && (
                  passwordFormik.errors.newPassword ? (
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  ) : passwordFormik.values.newPassword.length >= 6 ? (
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  ) : null
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                },
                '& .MuiFormHelperText-root': {
                  color: passwordFormik.touched.newPassword && !passwordFormik.errors.newPassword && passwordFormik.values.newPassword.length >= 6 ? 'success.main' : undefined
                }
              }}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirmar Nueva Contraseña"
              name="confirmPassword"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={
                passwordFormik.touched.confirmPassword &&
                Boolean(passwordFormik.errors.confirmPassword)
              }
              helperText={
                passwordFormik.touched.confirmPassword
                  ? passwordFormik.errors.confirmPassword || (passwordFormik.values.confirmPassword === passwordFormik.values.newPassword && passwordFormik.values.confirmPassword ? '✓ Las contraseñas coinciden' : '')
                  : 'Repite la nueva contraseña'
              }
              InputProps={{
                endAdornment: passwordFormik.values.confirmPassword && (
                  passwordFormik.errors.confirmPassword ? (
                    <ErrorIcon sx={{ color: 'error.main' }} />
                  ) : passwordFormik.values.confirmPassword === passwordFormik.values.newPassword && passwordFormik.values.confirmPassword ? (
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  ) : null
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                },
                '& .MuiFormHelperText-root': {
                  color: passwordFormik.touched.confirmPassword && !passwordFormik.errors.confirmPassword && passwordFormik.values.confirmPassword === passwordFormik.values.newPassword && passwordFormik.values.confirmPassword ? 'success.main' : undefined
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Button 
              onClick={() => setOpenPasswordDialog(false)} 
              disabled={loading}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !passwordFormik.isValid || !passwordFormik.dirty || isCurrentPasswordValid !== true}
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Profile;
