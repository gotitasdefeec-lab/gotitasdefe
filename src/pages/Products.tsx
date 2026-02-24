import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  DialogContentText,
} from '@mui/material';

import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

import { productsApi, categoriesApi, API_URL } from '../services/api';
import { compressImages, validateImageFile } from '../utils/imageCompression';

/**
 * Función helper para notificar al storefront (Next.js) que debe revalidar su caché.
 * Esto permite que los cambios en productos aparezcan instantáneamente en la tienda.
 */
async function revalidateStorefront(actions: string[]) {
  const storefrontUrl = process.env.REACT_APP_STOREFRONT_URL || 'https://www.gotasdefe.com';
  const revalidationToken = process.env.REACT_APP_REVALIDATION_TOKEN;

  // Si no hay token configurado, no hacemos nada (modo desarrollo local probablemente)
  if (!revalidationToken) {
    console.warn('⚠️ REVALIDATION_TOKEN no configurado. Los cambios no se reflejarán automáticamente en el storefront.');
    return;
  }

  try {
    for (const action of actions) {
      const response = await fetch(`${storefrontUrl}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: revalidationToken, action }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Caché revalidado en storefront: ${action}`, data);
      } else {
        console.error(`❌ Error al revalidar action "${action}":`, response.status, response.statusText);
      }
    }
  } catch (error) {
    // Error silencioso - no afecta la funcionalidad del admin
    console.error('❌ No se pudo conectar con el storefront para revalidar:', error);
  }
}

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock?: number;
  category: string;
  images?: string[];
  status?: 'active' | 'inactive';
  sku: string;
};

const Products = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id?: number, name?: string }>({ open: false });
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [form, setForm] = useState({
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    minStock: 10,
    category: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    images: [] as string[],
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('El nombre es obligatorio'),
    sku: Yup.string(),
    price: Yup.number().typeError('Debe ser un número').min(0, 'No puede ser negativo').required('El precio es obligatorio'),
    stock: Yup.number().typeError('Debe ser un número').min(0, 'No puede ser negativo').required('El stock es obligatorio'),
    minStock: Yup.number().typeError('Debe ser un número').min(0, 'No puede ser negativo').required('El mínimo es obligatorio'),
    category: Yup.string().required('La categoría es obligatoria'),
    description: Yup.string(),
    status: Yup.string().oneOf(['active', 'inactive']),
    images: Yup.array().of(Yup.string().required('La imagen es obligatoria')).min(1, 'Al menos una imagen es obligatoria'),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Carga simultánea para evitar desincronización
        const [prodRes, catRes] = await Promise.all([
          productsApi.getAll(),
          categoriesApi.getAll()
        ]);

        const categoriesData = Array.isArray(catRes) ? catRes : (catRes.data || []);
        setCategories(categoriesData as { id: number, name: string }[]);

        const productsData = Array.isArray(prodRes) ? prodRes : (prodRes.data || []);
        const list: Product[] = (productsData as any[]).map((p: any) => ({
          id: Number(p.id),
          name: p.name,
          description: p.description ?? '',
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          minStock: Number((p as any).minStock) || 10,
          category: p.category ?? '',
          images: Array.isArray(p.images) ? p.images : [],
          status: (p.status as 'active' | 'inactive') ?? 'active',
          sku: p.sku ?? '',
        }));
        setProducts(list);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- CORRECCIÓN 1: Helper para Imágenes robusto ---
  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath || typeof imagePath !== 'string') return 'https://placehold.co/200x200';
    const path = imagePath.trim();
    
    // Si es base64 o URL completa
    if (path.startsWith('data:image') || path.startsWith('http')) {
      if (path.includes('via.placeholder.com')) return 'https://placehold.co/200x200';
      return path;
    }
    
    // Ruta relativa: aseguramos que se una bien con la API_URL
    return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  };

  // --- CORRECCIÓN 2: Helper para obtener Nombre de Categoría ---
  // Si el producto tiene guardado el ID "1", esto buscará "Ropa"
  const getCategoryName = (catValue: string | number) => {
    if (!catValue) return 'Sin categoría';
    const found = categories.find(c => String(c.id) === String(catValue) || c.name === catValue);
    if (found) return found.name;
    return String(catValue);
  };

  const sortOptions = [
    { label: 'Nombre (A-Z)', value: 'name_asc' },
    { label: 'Nombre (Z-A)', value: 'name_desc' },
    { label: 'Precio (Menor a Mayor)', value: 'price_asc' },
    { label: 'Precio (Mayor a Menor)', value: 'price_desc' },
    { label: 'Stock (Menor a Mayor)', value: 'stock_asc' },
    { label: 'Stock (Mayor a Menor)', value: 'stock_desc' },
  ];

  const handleOpenFilter = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };

  const handleOpenSort = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleCloseSort = () => {
    setSortAnchorEl(null);
  };

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    // --- CORRECCIÓN 3: Convertir ID a Nombre al editar ---
    // Esto hace que el dropdown (Select) reconozca el valor actual
    const catName = getCategoryName(product.category);
    
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      minStock: product.minStock ?? 10,
      category: catName, 
      description: product.description || '',
      status: product.status || 'active',
      images: product.images || [],
    });
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      await productsApi.delete(String(productId));
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setSnackbar({ open: true, message: 'Producto eliminado correctamente', severity: 'success' });
      
      // ✨ Revalidar caché del storefront para reflejar la eliminación
      revalidateStorefront(['products', 'featured-products', `product-${productId}`]);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Error al eliminar producto', severity: 'error' });
    }
  };

  const openNewProductDialog = () => {
    setCurrentProduct(null);
    setForm({ name: '', sku: '', price: 0, stock: 0, minStock: 10, category: '', description: '', status: 'active', images: [] });
    setDialogOpen(true);
  };

  const handleSaveProduct = async (values: typeof form) => {
    const payload = { ...values } as any;
    if (payload.sku === '') {
      payload.sku = null;
    }
    try {
      if (currentProduct) {
        const res = await productsApi.update(String(currentProduct.id), payload);
        const updated = Array.isArray(res) ? res[0] : (res.data || res);
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? { ...p, ...updated } : p))
        );
        setSnackbar({ open: true, message: 'Producto actualizado', severity: 'success' });
        
        // ✨ Revalidar caché del storefront para mostrar cambios instantáneamente
        revalidateStorefront(['products', 'featured-products', `product-${currentProduct.id}`]);
      } else {
        const res = await productsApi.create(payload);
        const created = Array.isArray(res) ? res[0] : (res.data || res);
        // Construimos el objeto completo para la UI
        const newProduct: Product = {
          id: Number(created.id),
          name: created.name,
          sku: created.sku,
          price: Number(created.price) || 0,
          stock: Number(created.stock) || 0,
          minStock: Number((created as any).minStock) || Number(values.minStock) || 10,
          category: created.category || '',
          description: created.description || '',
          status: (created.status as 'active' | 'inactive') || 'active',
          images: Array.isArray(created.images) ? created.images : [],
        };
        setProducts((prev) => [newProduct, ...prev]);
        setSnackbar({ open: true, message: 'Producto creado', severity: 'success' });
        
        // ✨ Revalidar caché del storefront para mostrar el nuevo producto
        revalidateStorefront(['products', 'featured-products']);
      }
      setDialogOpen(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Error al guardar producto', severity: 'error' });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderProductDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
      <Formik
        initialValues={form}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSaveProduct}
      >
        {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
          <Form>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Producto"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name ? errors.name : 'Ej: Camiseta básica'}
                    required
                    placeholder="Ej: Camiseta básica"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SKU (opcional)"
                    name="sku"
                    value={values.sku}
                    onChange={handleChange}
                    error={touched.sku && Boolean(errors.sku)}
                    helperText={touched.sku && errors.sku ? errors.sku : 'Código interno o de proveedor'}
                    placeholder="Ej: TS-001"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Precio"
                    type="number"
                    name="price"
                    value={values.price}
                    onChange={handleChange}
                    error={touched.price && Boolean(errors.price)}
                    helperText={touched.price && errors.price ? errors.price : 'Precio de venta al público'}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    required
                    placeholder="Ej: 19.99"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Stock"
                    type="number"
                    name="stock"
                    value={values.stock}
                    onChange={handleChange}
                    error={touched.stock && Boolean(errors.stock)}
                    helperText={touched.stock && errors.stock ? errors.stock : 'Cantidad disponible'}
                    required
                    placeholder="Ej: 50"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mínimo"
                    type="number"
                    name="minStock"
                    value={values.minStock}
                    onChange={handleChange}
                    error={touched.minStock && Boolean(errors.minStock)}
                    helperText={touched.minStock && errors.minStock ? String(errors.minStock) : 'Umbral de alerta para stock bajo'}
                    required
                    placeholder="Ej: 10"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={touched.category && Boolean(errors.category)}>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      name="category"
                      value={values.category}
                      onChange={handleChange}
                      label="Categoría"
                    >
                      <MenuItem value=""><em>Seleccionar categoría</em></MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                    {touched.category && errors.category && (
                      <Typography color="error" variant="caption">{errors.category}</Typography>
                    )}
                  </FormControl>
                  <Box mt={1} display="flex" gap={1}>
                    <TextField
                      size="small"
                      label="Nueva categoría"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Ej: Calzado"
                    />
                    <Button
                      variant="outlined"
                      disabled={!newCategory.trim()}
                      onClick={async () => {
                        const name = newCategory.trim();
                        if (!name) return;
                        const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
                        if (exists) {
                          setSnackbar({ open: true, message: 'Ya existe una categoría con ese nombre', severity: 'error' });
                          return;
                        }
                        try {
                          const res = await categoriesApi.create({ name });
                          const cat = Array.isArray(res) ? res[0] : (res.data || res);
                          setCategories(prev => [...prev, cat]);
                          setFieldValue('category', cat.name);
                          setNewCategory('');
                          setSnackbar({ open: true, message: 'Categoría creada', severity: 'success' });
                        } catch {
                          setSnackbar({ open: true, message: 'Error al crear categoría', severity: 'error' });
                        }
                      }}
                    >Agregar</Button>
                    <Button
                      variant="text"
                      onClick={() => setManageCategoriesOpen(true)}
                    >Gestionar</Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.status === 'active'}
                        onChange={(e) => setFieldValue('status', e.target.checked ? 'active' : 'inactive')}
                        color="primary"
                      />
                    }
                    label="Producto activo (visible en el sistema)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Descripción del producto
                  </Typography>
                  <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    <TextField
                      value={values.description}
                      onChange={handleChange}
                      name="description"
                      multiline
                      minRows={6}
                      fullWidth
                      placeholder="Detalles, materiales, cuidados, etc."
                      sx={{ bgcolor: '#fff' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                  >
                    Subir Imágenes
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          try {
                            // Validar archivos antes de comprimir
                            const filesArray = Array.from(files);
                            let totalSizeMB = 0;
                            let hasLargeImages = false;

                            filesArray.forEach(file => {
                              const sizeMB = file.size / (1024 * 1024);
                              totalSizeMB += sizeMB;
                              if (sizeMB > 5) {
                                hasLargeImages = true;
                              }
                              validateImageFile(file, 20); // Máx 20MB por imagen
                            });

                            // Mostrar advertencia si hay imágenes grandes
                            if (hasLargeImages) {
                              setSnackbar({ 
                                open: true, 
                                message: `⚠️ Imágenes grandes detectadas (${totalSizeMB.toFixed(1)}MB total). Se optimizarán automáticamente en el servidor.`, 
                                severity: 'info' 
                              });
                            }

                            // Mostrar feedback de compresión
                            setSnackbar({ 
                              open: true, 
                              message: `Comprimiendo ${files.length} imagen(es)...`, 
                              severity: 'info' 
                            });

                            // Comprimir imágenes automáticamente (19MB → ~200KB)
                            const compressedImages = await compressImages(files, {
                              maxWidth: 1920,
                              maxHeight: 1920,
                              quality: 0.85,
                              maxSizeMB: 1, // Máximo 1MB después de comprimir
                            });

                            setFieldValue('images', [...values.images, ...compressedImages]);
                            
                            setSnackbar({ 
                              open: true, 
                              message: `✅ ${files.length} imagen(es) preparada(s). Se optimizarán en el servidor al guardar.`, 
                              severity: 'success' 
                            });
                          } catch (error: any) {
                            setSnackbar({ 
                              open: true, 
                              message: error.message || 'Error al procesar imágenes', 
                              severity: 'error' 
                            });
                          }
                        }
                      }}
                    />
                  </Button>
                  {values.images && values.images.length > 0 && (
                    <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
                      {values.images.map((img, idx) => (
                        <Box key={idx} position="relative">
                          <img src={getImageUrl(img)} alt={`preview-${idx}`} style={{ maxHeight: 120, maxWidth: 120, borderRadius: 4, border: '1px solid #ccc' }} />
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ position: 'absolute', top: 0, right: 0, background: '#fff' }}
                            onClick={() => setFieldValue('images', values.images.filter((_, i) => i !== idx))}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  {touched.images && errors.images && (
                    <Typography color="error" variant="caption">{(errors.images as string) || ''}</Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button variant="contained" type="submit" disabled={isSubmitting}>
                Guardar
              </Button>
            </DialogActions>

            {/* Diálogo de gestión de categorías */}
            <Dialog open={manageCategoriesOpen} onClose={() => setManageCategoriesOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Gestionar categorías</DialogTitle>
              <DialogContent dividers>
                <List>
                  {categories.map((cat) => (
                    <ListItem
                      key={cat.id}
                    >
                      {editingCatId === cat.id ? (
                        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                          <TextField
                            size="small"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            fullWidth
                          />
                          <Button
                            size="small"
                            variant="contained"
                            onClick={async () => {
                              const name = editingCatName.trim();
                              if (!name) return;
                              const exists = categories.some(c => c.id !== cat.id && c.name.toLowerCase() === name.toLowerCase());
                              if (exists) {
                                setSnackbar({ open: true, message: 'Ya existe una categoría con ese nombre', severity: 'error' });
                                return;
                              }
                              try {
                                await categoriesApi.update(cat.id, { name });
                                setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name } : c));
                                if (values.category === cat.name) {
                                  setFieldValue('category', name);
                                }
                                setEditingCatId(null);
                                setEditingCatName('');
                                setSnackbar({ open: true, message: 'Categoría actualizada', severity: 'success' });
                              } catch (e: any) {
                                setSnackbar({ open: true, message: e?.message || 'Error al actualizar categoría', severity: 'error' });
                              }
                            }}
                          >Guardar</Button>
                          <Button size="small" onClick={() => { setEditingCatId(null); setEditingCatName(''); }}>Cancelar</Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <ListItemText primary={cat.name} />
                          <Box>
                            <Button size="small" onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}>Renombrar</Button>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => setConfirmDelete({ open: true, id: cat.id, name: cat.name })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </ListItem>
                  ))}
                  {categories.length === 0 && (
                    <Typography variant="body2" color="text.secondary">No hay categorías</Typography>
                  )}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setManageCategoriesOpen(false)}>Cerrar</Button>
              </DialogActions>
            </Dialog>

            {/* Confirmación de borrado */}
            <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false })}>
              <DialogTitle>Eliminar categoría</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  ¿Seguro que deseas eliminar la categoría "{confirmDelete.name}"?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmDelete({ open: false })}>Cancelar</Button>
                <Button color="error" variant="contained" onClick={async () => {
                  if (!confirmDelete.id) return;
                  try {
                    await categoriesApi.delete(confirmDelete.id);
                    setCategories(prev => prev.filter(c => c.id !== confirmDelete.id));
                    if (values.category && values.category === confirmDelete.name) {
                      setFieldValue('category', '');
                    }
                    setSnackbar({ open: true, message: 'Categoría eliminada', severity: 'success' });
                  } catch (e: any) {
                    setSnackbar({ open: true, message: e?.message || 'Error al eliminar categoría', severity: 'error' });
                  } finally {
                    setConfirmDelete({ open: false });
                  }
                }}>Eliminar</Button>
              </DialogActions>
            </Dialog>
          </Form>
        )}
      </Formik>
    </Dialog>
  );

  const renderGridView = () => (
    <Grid container spacing={3}>
      {filteredProducts.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={getImageUrl(product.images && product.images.length > 0 ? product.images[0] : undefined) || 'https://placehold.co/200x200'}
              alt={product.name}
            />
            <CardContent>
              <Typography variant="h6" noWrap>
                {product.name}
              </Typography>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                ${product.price}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Chip
                  size="small"
                  label={`Stock: ${product.stock}`}
                  color={product.stock > (product.minStock || 10) ? 'success' : 'warning'}
                  sx={{ mr: 1 }}
                />
                {/* CORRECCIÓN: Usar getCategoryName */}
                <Chip
                  size="small"
                  label={getCategoryName(product.category)}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEditProduct(product)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Imagen</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>Precio</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Mínimo</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Box
                  component="img"
                  src={getImageUrl(product.images && product.images.length > 0 ? product.images[0] : undefined) || 'https://placehold.co/50x50'}
                  alt={product.name}
                  sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2">{product.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {(product.description || '').substring(0, 60)}...
                </Typography>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={product.stock}
                  color={product.stock > (product.minStock || 10) ? 'success' : 'warning'}
                />
              </TableCell>
              <TableCell>{product.minStock || 10}</TableCell>
              <TableCell>
                {/* CORRECCIÓN: Usar getCategoryName */}
                <Chip
                  size="small"
                  label={getCategoryName(product.category)}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={product.status === 'active' ? 'Activo' : 'Inactivo'}
                  color={product.status === 'active' ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEditProduct(product)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Productos</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openNewProductDialog}
        >
          Nuevo Producto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar productos..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 400, lg: 500 } }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={handleOpenFilter}
        >
          Filtrar
        </Button>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleCloseFilter}
        >
          <MenuItem
            onClick={() => {
              setSelectedCategory('all');
              handleCloseFilter();
            }}
          >
            Todas las categorías
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                handleCloseFilter();
              }}
            >
              {cat.name}
            </MenuItem>
          ))}
        </Menu>

        <Button
          variant="outlined"
          startIcon={<SortIcon />}
          onClick={handleOpenSort}
        >
          Ordenar
        </Button>
        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={handleCloseSort}
        >
          {sortOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => {
                // Implementar lógica de ordenamiento
                handleCloseSort();
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={viewMode === 'grid' ? 'Vista de Lista' : 'Vista de Cuadrícula'}>
          <IconButton
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Cargando productos…</Typography>
        </Paper>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
      {renderProductDialog()}

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

export default Products;