import React, { useEffect, useMemo, useState } from 'react';
import { getStoreShipping } from '../services/storeShippingService';
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
  Chip,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Pagination,
  Stack,
  Autocomplete,
  Avatar,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { salesApi, productsApi, inventoryApi, API_URL } from '../services/api';
import { Visibility, Download, Refresh, AttachFile, Delete, Image as ImageIcon, Email, WhatsApp, Phone } from '@mui/icons-material';
import Divider from '@mui/material/Divider';

const Sales = () => {
  // Helpers para mostrar el estado con label y color
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Pagado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };
  // Estado para configuración de envío gratis
  const [freeShippingMin, setFreeShippingMin] = useState<number>(50);
  useEffect(() => {
    getStoreShipping().then(cfg => {
      setFreeShippingMin(Number(cfg.freeShippingMin) || 0);
    }).catch(() => {});
  }, []);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [editCustomer, setEditCustomer] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // --- fetchSales y fetchProducts en el scope principal ---
  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await salesApi.getAll();
      // El backend NestJS devuelve directamente el array, no encapsulado en data
      const salesData = Array.isArray(res) ? res : (res.data || []);
      const list = (salesData as any[]).map((s: any) => ({
        id: Number(s.id),
        date: s.date || '—',
        customer: s.customerName || (typeof s.customer === 'object' ? s.customer?.name : s.customer) || '—',
        cedula: s.cedula || '',
        customerEmail: s.customerEmail || (s.customer && s.customer.email) || '',
        total: Number(s.total) || 0,
        // Normalizamos estados inválidos como 'processing' a 'pending'
        status: (s.status === 'processing' ? 'pending' : (s.status || 'pending')),
        items: Array.isArray(s.items) ? s.items : [],
        notes: s.notes || '',
        shippingAddress: s.shippingAddress || '',
        shippingPhone: s.shippingPhone || '',
        shippingMethodId: s.shippingMethodId || '',
        shippingMethodName: s.shippingMethodName || '',
        shippingCost: Number(s.shippingCost ?? 0),
        shippingCarrier: s.shippingCarrier || '',
        shippingRegion: s.shippingRegion || '',
        shippingScope: s.shippingScope || '',
        shippingEta: s.shippingEta || '',
        taxPercent: Number(s.taxPercent) || 0,
        discountPercent: Number(s.discountPercent) || 0,
        attachments: Array.isArray(s.attachments) ? s.attachments : [],
      }));
      setSales(list);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar ventas');
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await productsApi.getAll();
      const productsData = Array.isArray(res.data) ? res.data : [];
      setProducts(productsData as any[]);
    } catch {}
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    let data = [...sales];
    if (statusFilter !== 'all') data = data.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(s =>
        String(s.id).includes(q) ||
        s.customer.toLowerCase().includes(q) ||
        (s.cedula && String(s.cedula).toLowerCase().includes(q))
      );
    }
    return data;
  }, [sales, statusFilter, search]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const openDetails = (row: any) => {
    setSelected(row);
    setEditCustomer(row.customer || '');
    setCedula(row.cedula || '');
    setCustomerEmail(row.customerEmail || '');
    setNotes(row.notes || '');
    setShippingAddress(row.shippingAddress || '');
    setShippingPhone(row.shippingPhone || '');
    setShippingMethodName(row.shippingMethodName || '');
    setShippingCost(Number(row.shippingCost ?? 0));
    setShippingCarrier(row.shippingCarrier || '');
    setShippingRegion(row.shippingRegion || '');
    setShippingScope(row.shippingScope || '');
    setShippingEta(row.shippingEta || '');
    setTaxPercent(row.taxPercent ?? 0);
    setDiscountPercent(row.discountPercent ?? 0);
    
    setLocalAttachments(Array.isArray(row.attachments) ? row.attachments : []);
    setOpenDetail(true);
  };

  const closeDetails = () => setOpenDetail(false);

  const updateStatus = async (row: any, status: string) => {
    if (status === 'cancelled') {
      // Abrir diálogo de confirmación; restauraremos stock solo tras confirmar
      setSelected(row);
      setCancelOpen(true);
      return;
    }
    try {
      const payload: any = { status };
      if (customerEmail && typeof customerEmail === 'string') {
        payload.customerEmail = customerEmail.trim();
      }
      await salesApi.update(row.id, payload);
      setSales(prev => prev.map(s => s.id === row.id ? { ...s, status } : s));
      if (selected && selected.id === row.id) setSelected({ ...selected, status, ...(payload.customerEmail ? { customerEmail: payload.customerEmail } : {}) });
    } catch (e) {}
  };

  const exportCSV = () => {
    const rows = filtered.map(s => ({
      id: s.id,
      date: s.date,
      customer: s.customer,
      total: s.total,
      status: s.status,
      items: Array.isArray(s.items) ? s.items.length : s.items,
      metodoEnvio: s.shippingMethodName || '',
      costoEnvio: Number(s.shippingCost ?? 0).toFixed(2),
    }));
    const header = 'ID,Fecha,Cliente,Total,Estado,Items,MetodoEnvio,CostoEnvio';
    const csv = [
      header,
      ...rows.map(r => `${r.id},${r.date},${r.customer},${r.total},${r.status},${r.items},${r.metodoEnvio},${r.costoEnvio}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Campos adicionales en detalle
  const [shippingAddress, setShippingAddress] = useState('');
  const [cedula, setCedula] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  
  // Extrae la ciudad del campo dirección si no está shippingRegion
  function extractCityFromAddress(address: string): string {
    if (!address) return '';
    // Busca ciudad por formato común: "calle, número, ciudad, CP"
    const parts = address.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Toma el penúltimo como ciudad si parece válido
      const city = parts[parts.length - 2];
      if (city && city.length > 2 && !/\d/.test(city)) return city;
    }
    // Alternativamente busca palabras comunes de ciudad
    const match = address.match(/(guayaquil|quito|cuenca|manta|ambato|machala|duran|portoviejo|loja|santo domingo)/i);
    return match ? match[1] : '';
  }
  // Envío (editable en detalle)
  const [shippingMethodName, setShippingMethodName] = useState('');
  const [shippingCost, setShippingCost] = useState<number>(0);
  // Metadatos de envío (solo lectura, si existen)
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [shippingRegion, setShippingRegion] = useState('');
  const [shippingScope, setShippingScope] = useState('');
  const [shippingEta, setShippingEta] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [localAttachments, setLocalAttachments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [addProductId, setAddProductId] = useState('');
  const [addProductQty, setAddProductQty] = useState(1);
  // Snackbar para copiado
  const [copySnack, setCopySnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({ open: false, message: '', severity: 'success' });
  const closeCopySnack = (_?: any, reason?: string) => {
    if (reason === 'clickaway') return;
    setCopySnack(prev => ({ ...prev, open: false }));
  };

  const subtotal = useMemo(() => {
    const arr = Array.isArray(selected?.items) ? selected!.items : [];
    return arr.reduce((sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
  }, [selected]);

  // Helper para resolver imágenes (base64, absolutas o rutas relativas del backend)
  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return undefined;
    if (typeof imagePath !== 'string') return undefined;
    const path = imagePath.trim();
    // Allow base64 images through
    if (path.startsWith('data:image')) return path;
    // Absolute URLs: rewrite known-broken external placeholder host to a safer one
    if (path.startsWith('http://') || path.startsWith('https://')) {
      if (path.includes('via.placeholder.com')) {
        // Try to preserve size if the path contains a size like /40 or /40x40
        const m = path.match(/via\.placeholder\.com\/([0-9]+(?:x[0-9]+)?)/);
        const size = m && m[1] ? m[1] : '40x40';
        return `https://placehold.co/${size}`;
      }
      return path;
    }
    // Relative path from backend
    return `${API_URL}${path}`;
  };

  const computedTotal = useMemo(() => {
    const tax = subtotal * (Number(taxPercent) / 100);
    const discount = subtotal * (Number(discountPercent) / 100);
    const ship = Number(shippingCost || 0);
    return Math.max(0, Number((subtotal + tax - discount + ship).toFixed(2)));
  }, [subtotal, taxPercent, discountPercent, shippingCost]);

  const onUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const reads: Promise<any>[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) return; // 2MB max
      const reader = new FileReader();
      reads.push(new Promise((resolve) => {
        reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
        reader.readAsDataURL(file);
      }));
    });
    Promise.all(reads).then((result) => {
      setLocalAttachments(prev => [...result, ...prev].slice(0, 10));
    });
  };

  const removeAttachment = (idx: number) => {
    setLocalAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const downloadAttachment = (att: any) => {
    try {
      const url = typeof att.data === 'string' ? att.data : '';
      const a = document.createElement('a');
      a.href = url;
      a.download = att.name || 'archivo';
      a.click();
    } catch {}
  };

  // Construye un payload seguro para el backend (evita campos no soportados)
  const buildSafeSalePayload = (opts: {
    forCreate?: boolean;
  } = {}) => {
    const base: any = {
      // Preferimos customerName; evitamos enviar 'customer' para no chocar con relaciones
      customerName: editCustomer,
      customerEmail: customerEmail?.trim() || undefined,
      notes: notes || undefined,
      shippingAddress: shippingAddress || undefined,
      shippingPhone: shippingPhone || undefined,
      shippingMethodName: shippingMethodName || undefined,
      shippingCost: Number.isFinite(Number(shippingCost)) ? Number(shippingCost) : 0,
      // Algunos backends calculan estos campos; los enviamos solo si son > 0
      taxPercent: Number(taxPercent) > 0 ? Number(taxPercent) : undefined,
      discountPercent: Number(discountPercent) > 0 ? Number(discountPercent) : undefined,
      status: selected?.status || 'pending',
      date: selected?.date || new Date().toISOString().slice(0, 10),
    };

    // En creación algunos backends requieren items; en edición a veces rompen con nested updates
    if (opts.forCreate) {
      base.items = Array.isArray(selected?.items) ? selected!.items : [];
      // Evitar enviar blobs/base64 pesados si el backend no lo soporta
      if (Array.isArray(localAttachments) && localAttachments.length > 0) {
        base.attachments = localAttachments.map(a => ({ name: a.name, type: a.type }));
      }
    }

    // Limpia claves con undefined o strings vacíos
    Object.keys(base).forEach((k) => {
      if (base[k] === undefined || base[k] === '') delete base[k];
    });
    return base;
  };

  const saveDetails = async () => {
    if (!selected) return;
    try {
      const isCreate = !selected.id;
      const payload = buildSafeSalePayload({ forCreate: isCreate });
      if (!selected.id) {
        // Nuevo pedido
        const res = await salesApi.create(payload);
        const created = res.data;
        // Refrescar productos desde backend para mostrar stock actualizado
          await fetchProducts();
        setSales(prev => [{ ...created, ...payload, id: created.id }, ...prev]);
        setSelected({ ...created, ...payload, id: created.id });
        setCopySnack({ open: true, message: 'Pedido creado y stock descontado', severity: 'success' });
      } else {
        // Editar pedido existente
        try {
          await salesApi.update(selected.id, payload);
        } catch (err: any) {
          // Fallback 1: enviar únicamente campos de envío/contacto y notas
          const minimal1: any = {
            customerName: editCustomer || undefined,
            customerEmail: customerEmail?.trim() || undefined,
            notes: notes || undefined,
            shippingAddress: shippingAddress || undefined,
            shippingPhone: shippingPhone || undefined,
            shippingMethodName: shippingMethodName || undefined,
            shippingCost: Number.isFinite(Number(shippingCost)) ? Number(shippingCost) : undefined,
            status: selected.status || 'pending',
          };
          Object.keys(minimal1).forEach((k) => {
            if (minimal1[k] === undefined || minimal1[k] === '') delete minimal1[k];
          });
          try {
            await salesApi.update(selected.id, minimal1);
          } catch (err2: any) {
            // Fallback 2: solo estado para desbloquear cambios básicos
            await salesApi.updateStatus(selected.id, selected.status || 'pending');
          }
        }
          await fetchProducts();
        setSales(prev => prev.map(s => s.id === selected.id ? { ...s, ...payload } : s));
        setSelected({ ...selected, ...payload });
        setCopySnack({ open: true, message: 'Pedido actualizado', severity: 'success' });
      }
    } catch (e: any) {
      // Registra más contexto para depurar 500s del backend
      if (e?.response) {
        // eslint-disable-next-line no-console
        console.error('Error al guardar pedido:', {
          status: e.response.status,
          data: e.response.data,
          url: e.config?.url,
          method: e.config?.method,
        });
      } else {
        // eslint-disable-next-line no-console
        console.error('Error al guardar pedido (sin response):', e);
      }
      const serverMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message;
      const code = e?.response?.status ? ` (HTTP ${e.response.status})` : '';
      setCopySnack({ open: true, message: `Error${code}: ${serverMsg || 'No se pudo guardar el pedido'}` , severity: 'error' });
    }
  };

  const printInvoice = () => {
    if (!selected) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const itemsRows = (Array.isArray(selected.items) ? selected.items : []).map((it: any) => `
      <tr>
        <td style="padding:4px 8px;">${it.productId}</td>
        <td style="padding:4px 8px;">${it.quantity}</td>
        <td style="padding:4px 8px;">$${it.price}</td>
      </tr>
    `).join('');
    w.document.write(`
      <html><head><title>Pedido #${selected.id}</title></head>
      <body style="font-family:Arial,sans-serif; padding:16px;">
        <h2>Pedido #${selected.id}</h2>
        <p><strong>Fecha:</strong> ${selected.date}</p>
  <p><strong>Nombre:</strong> ${editCustomer || selected.customer}</p>
  ${cedula ? `<p><strong>Cédula:</strong> ${cedula}</p>` : ''}
  ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
  ${shippingPhone ? `<p><strong>Teléfono:</strong> ${shippingPhone}</p>` : ''}
  ${shippingAddress ? `<p><strong>Dirección:</strong> ${shippingAddress}</p>` : ''}
  ${(selected?.shippingRegion || extractCityFromAddress(selected?.shippingAddress)) ? `<p><strong>Ciudad:</strong> ${selected?.shippingRegion || extractCityFromAddress(selected?.shippingAddress)}</p>` : ''}
  ${selected?.customerPostalCode ? `<p><strong>Código Postal:</strong> ${selected.customerPostalCode}</p>` : ''}
  ${selected?.customerCountry ? `<p><strong>País:</strong> ${selected.customerCountry}</p>` : ''}
        ${shippingMethodName ? `<p><strong>Método de envío:</strong> ${shippingMethodName} ${Number(shippingCost||0) ? `( $${Number(shippingCost).toFixed(2)} )` : ''}</p>` : ''}
        ${(selected?.shippingRegion || extractCityFromAddress(selected?.shippingAddress)) ? `<p><strong>Ciudad:</strong> ${selected?.shippingRegion || extractCityFromAddress(selected?.shippingAddress)}</p>` : ''}
        ${selected?.shippingCarrier ? `<p><strong>Carrier:</strong> ${selected.shippingCarrier}</p>` : ''}
        ${selected?.shippingScope ? `<p><strong>Alcance:</strong> ${selected.shippingScope}</p>` : ''}
        ${selected?.shippingEta ? `<p><strong>ETA:</strong> ${selected.shippingEta}</p>` : ''}
  ${notes ? `<p><strong>Notas:</strong> ${notes}</p>` : ''}
        <table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; margin-top:12px;">
          <thead>
            <tr>
              <th style="text-align:left; padding:4px 8px;">Producto</th>
              <th style="text-align:left; padding:4px 8px;">Cant.</th>
              <th style="text-align:left; padding:4px 8px;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div style="margin-top:12px; text-align:right;">
          <div>Subtotal: $${subtotal.toFixed(2)}</div>
          <div>IVA (${taxPercent}%): $${(subtotal*Number(taxPercent)/100).toFixed(2)}</div>
          <div>Descuento (${discountPercent}%): -$${(subtotal*Number(discountPercent)/100).toFixed(2)}</div>
          <div>Envío: $${Number(shippingCost||0).toFixed(2)}</div>
          <h3>Total: $${computedTotal.toFixed(2)}</h3>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  const restoreStockForOrder = async (order: any) => {
    if (!order || !Array.isArray(order.items)) return;
    for (const item of order.items) {
      if (!item.productId || !item.quantity) continue;
      try {
        // 1) Leer inventario actual si existe
        const inv = await inventoryApi.getByProductId(String(item.productId));
        let baseQty = Number(inv?.quantity ?? 0);
        // 2) Si no hay inventario, usar el stock del producto como base
        if (!inv) {
          try {
            const resProd = await productsApi.getById(String(item.productId));
            // Nest devuelve el objeto en res.data
            baseQty = Number(resProd.data?.stock ?? 0);
          } catch {}
        }
        const newStock = baseQty + Number(item.quantity);
        // 3) Actualizar inventario (crea si no existe)
        await inventoryApi.updateStock(String(item.productId), newStock);
        // 4) Actualizar producto explícitamente para que la tabla de productos refleje el cambio
        try {
          // Si lo tenemos cargado en memoria, usamos su shape; si no, hacemos un getById para recuperar el shape
          const localProd = products.find((p: any) => String(p.id) === String(item.productId));
          if (localProd) {
            await productsApi.update(String(localProd.id), { ...localProd, stock: newStock });
            localProd.stock = newStock;
          } else {
            const resProd = await productsApi.getById(String(item.productId));
            const dataProd = resProd.data;
            if (dataProd?.id) {
              await productsApi.update(String(dataProd.id), { ...dataProd, stock: newStock });
            }
          }
        } catch {}
      } catch (err) {
        // Continuar con los siguientes items aunque alguno falle
        console.error('Error restaurando stock para item', item?.productId, err);
      }
    }
  };

  const deleteOrder = async (order: any) => {
    if (!order?.id) return;
    try {
      // Si la orden no está cancelada, restauramos stock
      if (order.status !== 'cancelled') {
        await restoreStockForOrder(order);
      }
      await salesApi.delete(order.id);
      setSales(prev => prev.filter(s => s.id !== order.id));
      if (selected && selected.id === order.id) {
        setSelected(null);
        setOpenDetail(false);
      }
    } catch (e) {}
  };

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
        <Typography 
          variant="h4" 
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontWeight: 600
          }}
        >
          Pedidos
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="small"
          onClick={() => {
            setSelected({
              id: '',
              date: new Date().toISOString().slice(0, 10),
              customer: '',
              cedula: '',
              customerEmail: '',
              total: 0,
              status: 'pending',
              items: [],
              notes: '',
              shippingAddress: '',
              shippingPhone: '',
              taxPercent: 0,
              discountPercent: 0,
              
              attachments: [],
            });
            setEditCustomer('');
            setCedula('');
            setCustomerEmail('');
            setNotes('');
            setShippingAddress('');
            setShippingPhone('');
            setShippingMethodName('');
            setShippingCost(0);
            setShippingCarrier('');
            setShippingRegion('');
            setShippingScope('');
            setShippingEta('');
            setTaxPercent(0);
            setDiscountPercent(0);
            
            setLocalAttachments([]);
            setOpenDetail(true);
          }}
          sx={{ 
            minHeight: { xs: 36, sm: 42 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            whiteSpace: 'nowrap',
            alignSelf: { xs: 'flex-start', sm: 'center' }
          }}
        >
          Nuevo Pedido
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Typography 
              color="error"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              {error}
            </Typography>
          </Paper>
        </Box>
      )}

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'center', 
          flexWrap: 'wrap' 
        }}>
          <TextField
            select
            label="Estado"
            size="small"
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            sx={{ 
              minWidth: { xs: '100%', sm: 120 },
              '& input': { fontSize: { xs: '0.9rem', sm: '1rem' } }
            }}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="completed">Completado</MenuItem>
            <MenuItem value="cancelled">Cancelado</MenuItem>
          </TextField>
          <TextField
            label="Buscar..."
            size="small"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              flex: { sm: 1 },
              '& input': { fontSize: { xs: '0.9rem', sm: '1rem' } }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 0.5, sm: 1 },
            ml: { sm: 'auto' }
          }}>
            <Tooltip title="Refrescar">
              <IconButton 
                onClick={() => window.location.reload()}
                size="small"
                sx={{ p: { xs: 0.75, sm: 1 } }}
              >
                <Refresh sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exportar CSV">
              <IconButton 
                onClick={exportCSV}
                size="small"
                sx={{ p: { xs: 0.75, sm: 1 } }}
              >
                <Download sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </Box>

      {loading ? (
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Cargando ventas…
          </Typography>
        </Paper>
      ) : (
      <TableContainer component={Paper} sx={{ 
        mb: { xs: 2, sm: 3 }, 
        overflowX: 'auto', 
        borderRadius: { xs: 2, sm: 3 }, 
        boxShadow: { xs: 1, sm: 3 } 
      }}>
        <Table size="small" sx={{ minWidth: { xs: 600, sm: 700, md: 800 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                minWidth: { xs: 40, sm: 60 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                ID
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 80, sm: 120 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                display: { xs: 'none', sm: 'table-cell' }
              }}>
                Fecha
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 100, sm: 160 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                Cliente
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 70, sm: 110 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                Cédula
              </TableCell>
              <TableCell align="right" sx={{ 
                minWidth: { xs: 60, sm: 90 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                Total
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 100, sm: 160 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                display: { xs: 'none', md: 'table-cell' }
              }}>
                Envío / Ciudad
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 40, sm: 80 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 },
                display: { xs: 'none', sm: 'table-cell' }
              }}>
                Items
              </TableCell>
              <TableCell sx={{ 
                minWidth: { xs: 70, sm: 120 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 1, sm: 2 }
              }}>
                Estado
              </TableCell>
              <TableCell align="right" sx={{ 
                minWidth: { xs: 60, sm: 120 }, 
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 0.5, sm: 2 }
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}>
                  {sale.id}
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>
                  {sale.date}
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}>
                  {sale.customer}
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', md: 'table-cell' }
                }}>
                  {sale.cedula || '—'}
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}>
                  ${(Number(sale.subtotal || 0) + Number(sale.shippingCost || 0) + (Number(sale.taxPercent || 0) > 0 ? Number(sale.subtotal || 0) * Number(sale.taxPercent || 0) / 100 : 0) - (Number(sale.discountPercent || 0) > 0 ? Number(sale.subtotal || 0) * Number(sale.discountPercent || 0) / 100 : 0)).toFixed(2)}
                </TableCell>
                <TableCell sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', md: 'table-cell' }
                }}>
                  {sale.shippingMethodName && sale.shippingCost !== undefined && sale.shippingCost !== null
                    ? (
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <span style={{ fontWeight: 500 }}>{sale.shippingMethodName}</span>
                        {Number(sale.subtotal || 0) >= freeShippingMin || Number(sale.shippingCost) === 0 ? (
                          <>
                            <span style={{ color: '#888', marginLeft: 4 }}>$0.00</span>
                            <Chip size="small" label="Envío gratis" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                          </>
                        ) : (
                          <span style={{ color: '#888', marginLeft: 4 }}>${Number(sale.shippingCost).toFixed(2)}</span>
                        )}
                        {sale.shippingRegion && (
                          <span style={{ color: '#888', marginLeft: 8 }}>{sale.shippingRegion}</span>
                        )}
                      </Stack>
                    )
                    : '—'}
                </TableCell>
                <TableCell align="center" sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  display: { xs: 'none', sm: 'table-cell' }
                }}>
                  {Array.isArray(sale.items) ? sale.items.length : 0}
                </TableCell>
                <TableCell sx={{ 
                  py: { xs: 0.75, sm: 1.5 },
                  px: { xs: 1, sm: 2 }
                }}>
                  <Chip label={getStatusLabel(sale.status)} color={getStatusColor(sale.status)} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Ver Detalle">
                      <IconButton size="small" onClick={() => openDetails(sale)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar pedido">
                      <IconButton size="small" color="error" onClick={() => deleteOrder(sale)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Pagination
          count={Math.max(1, Math.ceil(filtered.length / pageSize))}
          page={page}
          onChange={(_e, v) => setPage(v)}
          color="primary"
        />
      </Box>

      {/* Dialog Detalle */}
      <Dialog open={openDetail} onClose={closeDetails} maxWidth="md" fullWidth PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          borderRadius: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: { xs: '100%', sm: 800 },
          maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' }
        }
      }}>
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' }, px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          Detalle del Pedido #{selected?.id}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1, sm: 2 } }}>
          {/* Estado y acciones */}
          <Box sx={{ mb: 3, p: { xs: 1, sm: 2 }, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mr: 2, color: 'text.secondary' }}>
                Estado actual:
              </Typography>
              <Chip
                label={getStatusLabel(selected?.status || '')}
                color={getStatusColor(selected?.status || '')}
                sx={{ fontSize: 16, height: 32, px: 2 }}
              />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
              {selected?.status === 'pending' && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => updateStatus(selected, 'completed')}
                  sx={{ color: '#fff' }}
                >
                  ✓ Marcar como Pagado
                </Button>
              )}
              {selected?.status === 'completed' && (
                <Button
                  variant="contained"
                  color="info"
                  size="small"
                  onClick={() => updateStatus(selected, 'enviado')}
                >
                  📦 Marcar como Enviado
                </Button>
              )}
              {selected?.status === 'enviado' && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => updateStatus(selected, 'entregado')}
                >
                  ✓ Marcar como Entregado
                </Button>
              )}
              {(selected?.status === 'completed' || selected?.status === 'enviado' || selected?.status === 'entregado') && (
                <Tooltip title="Conecta la pasarela de pago para habilitar reembolsos">
                  <span>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled
                      onClick={() => {}}
                    >
                      ⟲ Reembolsar
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Stack>
          </Box>
          {/* Historial simple de eventos */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Historial</Typography>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="body2">Creado: {selected?.date || '—'}</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="body2">Estado: {getStatusLabel(selected?.status || 'pending')}</Typography>
              </Stack>
              {!!shippingMethodName && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main' }} />
                  <Typography variant="body2">Envío: {shippingMethodName} {Number(shippingCost||0) ? `($${Number(shippingCost).toFixed(2)})` : ''}</Typography>
                </Stack>
              )}
              {!!shippingEta && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                  <Typography variant="body2">ETA: {shippingEta}</Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }}
            onClick={async () => {
              const header: string[] = [];
              if (selected?.id) header.push(`Pedido #: ${selected.id}`);
              const fields: Array<[string, string]> = [
                ['Nombre', String(editCustomer || '').trim()],
                ['Cédula', String(cedula || '').trim()],
                ['Email', String(customerEmail || '').trim()],
                ['Teléfono', String(shippingPhone || '').trim()],
                ['Dirección', String(shippingAddress || '').trim()],
                ['Código Postal', String(selected?.customerPostalCode || '').trim()],
                ['País', String(selected?.customerCountry || 'Ecuador').trim()],
              ];
              const lines = [
                ...header,
                ...fields
                .filter(([, v]) => v && v.length > 0)
                .map(([k, v]) => `${k}: ${v}`),
              ];
              const textToCopy = lines.join('\n');
              if (!textToCopy) {
                setCopySnack({ open: true, message: 'No hay datos de envío para copiar', severity: 'warning' });
                return;
              }
              try {
                await navigator.clipboard.writeText(textToCopy);
                setCopySnack({ open: true, message: 'Datos de envío copiados', severity: 'success' });
              } catch (err) {
                setCopySnack({ open: true, message: 'No se pudo copiar. Copia manualmente.', severity: 'error' });
              }
            }}
          >
            Copiar datos de envío
          </Button>
          
          <Typography variant="body2" sx={{ mb: 1, fontSize: { xs: '0.95rem', sm: '1rem' } }}>Fecha: {selected?.date}</Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Cliente y Contacto</Typography>
              <Box sx={{ flex: 1 }} />
              <Stack direction="row" spacing={1}>
                {customerEmail ? (
                  <Tooltip title="Enviar correo">
                    <IconButton size="small" component="a" href={`mailto:${customerEmail}`}>
                      <Email fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {shippingPhone ? (
                  <Tooltip title="Llamar">
                    <IconButton size="small" component="a" href={`tel:${shippingPhone}`}>
                      <Phone fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {(shippingPhone || '').replace(/\D/g, '').length > 6 ? (
                  <Tooltip title="Abrir WhatsApp">
                    <IconButton size="small" component="a" target="_blank" rel="noopener" href={`https://wa.me/${(shippingPhone || '').replace(/\D/g, '')}`}>
                      <WhatsApp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Stack>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nombre"
                fullWidth
                size="small"
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
              />
              <TextField
                label="Cédula"
                size="small"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="10 dígitos"
              />
              <TextField
                label="Email"
                size="small"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@correo.com"
                error={Boolean(customerEmail) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)}
                helperText={Boolean(customerEmail) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ? 'Email inválido' : ' '}
              />
              <TextField
                label="Teléfono"
                size="small"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                placeholder="Ej: +593 99 123 4567"
              />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Dirección de Envío</Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Dirección"
                fullWidth
                size="small"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Calle, número, ciudad, CP"
              />
              <TextField
                label="Código Postal"
                size="small"
                value={selected?.customerPostalCode || ''}
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="País"
                size="small"
                value={selected?.customerCountry || 'Ecuador'}
                InputProps={{ readOnly: true }}
              />
            </Stack>
            <TextField
              label="Teléfono de envío"
              fullWidth
              size="small"
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              placeholder="Ej: +54 11 1234 5678"
              sx={{ mt: 2 }}
              InputProps={{ style: { fontSize: '1rem' } }}
            />
          </Paper>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Método de envío"
              fullWidth
              size="small"
              value={shippingMethodName ? `${shippingMethodName} ($${Number(shippingCost).toFixed(2)})` : ''}
              onChange={(e) => {
                // Permite editar el nombre y el valor juntos, pero separa el valor si se edita manualmente
                const val = e.target.value;
                const match = val.match(/^(.*)\s*\(\$([\d.]+)\)$/);
                if (match) {
                  setShippingMethodName(match[1].trim());
                  setShippingCost(Number(match[2]));
                } else {
                  setShippingMethodName(val);
                }
              }}
              placeholder="Ej: Guayaquil ($3.50)"
              helperText="Formato sugerido: Ciudad ($0.00). Se sumará al total automáticamente."
            />
          </Stack>
          {(shippingCarrier || shippingRegion || shippingScope || shippingEta) && (
            <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Detalle del método de envío</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {shippingCarrier && <TextField label="Carrier" size="small" value={shippingCarrier} InputProps={{ readOnly: true }} />}
                {shippingRegion && <TextField label="Región" size="small" value={shippingRegion} InputProps={{ readOnly: true }} />}
                {shippingScope && <TextField label="Alcance" size="small" value={shippingScope} InputProps={{ readOnly: true }} />}
                {shippingEta && <TextField label="ETA" size="small" value={shippingEta} InputProps={{ readOnly: true }} />}
              </Stack>
            </Paper>
          )}
          <TextField
            label="Notas"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del pedido, instrucciones de entrega, etc."
            sx={{ mb: 2 }}
            InputProps={{ style: { fontSize: '1rem' } }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="IVA %"
              type="number"
              size="small"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
            />
            <TextField
              label="Descuento %"
              type="number"
              size="small"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
            />
            <Box sx={{ flex: 1 }} />
          </Stack>
          {/* Totales destacados y pegados al fondo */}
          <Paper variant="outlined" sx={{ p: 2, mb: 2, position: 'sticky', bottom: 0, bgcolor: 'background.paper', zIndex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Resumen</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Subtotal: ${subtotal.toFixed(2)}</Typography>
                <Typography variant="body2">IVA: ${(subtotal * (Number(taxPercent)/100)).toFixed(2)}</Typography>
                <Typography variant="body2">Descuento: -${(subtotal * (Number(discountPercent)/100)).toFixed(2)}</Typography>
                {subtotal >= freeShippingMin ? (
                  <Typography variant="body2" color="success.main">Envío: $0.00 (Envío gratis)</Typography>
                ) : (
                  <Typography variant="body2">Envío: ${Number(shippingCost || 0).toFixed(2)}</Typography>
                )}
              </Box>
              <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box>
                <Typography variant="overline" sx={{ lineHeight: 1 }}>Total</Typography>
                <Typography variant="h5" sx={{ m: 0 }}>
                  ${
                    subtotal >= freeShippingMin
                      ? Math.max(0, Number((subtotal + (subtotal * (Number(taxPercent)/100)) - (subtotal * (Number(discountPercent)/100))).toFixed(2)))
                      : Number(computedTotal).toFixed(2)
                  }
                </Typography>
              </Box>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AttachFile fontSize="small" />
              <Typography variant="subtitle2">Comprobantes / Adjuntos</Typography>
              <Box sx={{ flex: 1 }} />
              <Button component="label" size="small" variant="outlined">
                Agregar archivos
                <input hidden type="file" multiple accept="image/*,application/pdf" onChange={onUploadFiles} />
              </Button>
            </Stack>
            {localAttachments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin adjuntos</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vista</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Tamaño</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localAttachments.map((att, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {String(att.type || '').startsWith('image/') ? (
                            <Box component="img" src={typeof att.data === 'string' ? att.data : ''} alt={att.name} sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, cursor: 'pointer' }} onClick={() => {
                              try { window.open(att.data, '_blank'); } catch {}
                            }} />
                          ) : (
                            <Box sx={{ width: 40, height: 40, bgcolor: '#f0f0f0', borderRadius: 1 }} />
                          )}
                        </TableCell>
                        <TableCell>{att.name}</TableCell>
                        <TableCell>{att.type}</TableCell>
                        <TableCell>{Math.round((att.size || 0)/1024)} KB</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={() => downloadAttachment(att)}>Descargar</Button>
                            <IconButton size="small" color="error" onClick={() => removeAttachment(idx)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
          <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Productos del pedido</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Autocomplete
                options={products}
                getOptionLabel={(option: any) => option.name}
                value={products.find((p: any) => String(p.id) === String(addProductId)) || null}
                onChange={(_e, val) => setAddProductId(val ? val.id : '')}
                renderOption={(props, option: any) => {
                  const { key, ...rest } = props as any;
                  const img = option.image || (Array.isArray(option.images) ? option.images[0] : undefined);
                  return (
                  <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar src={getImageUrl(img)} alt={option.name} variant="rounded" sx={{ width: 32, height: 32, mr: 1 }}>
                      <ImageIcon fontSize="small" />
                    </Avatar>
                    <span>{option.name}</span>
                    <Box sx={{ ml: 1, color: 'text.secondary', fontSize: 13 }}>${option.price}</Box>
                  </li>
                )}}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar producto" size="small" sx={{ minWidth: 180 }} />
                )}
                isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
              />
              <TextField
                label="Cantidad"
                type="number"
                size="small"
                value={addProductQty}
                onChange={e => setAddProductQty(Math.max(1, Number(e.target.value)))}
                sx={{ width: { xs: '100%', sm: 100 } }}
              />
              <Button
                variant="contained"
                size="small"
                disabled={!addProductId || addProductQty < 1}
                onClick={() => {
                  if (!selected) return;
                  const prod = products.find((p: any) => String(p.id) === String(addProductId));
                  if (!prod) return;
                  const items = Array.isArray(selected.items) ? [...selected.items] : [];
                  const existsIdx = items.findIndex((it: any) => String(it.productId) === String(prod.id));
                  if (existsIdx >= 0) {
                    items[existsIdx].quantity += addProductQty;
                  } else {
                    items.push({ productId: prod.id, name: prod.name, price: prod.price, quantity: addProductQty });
                  }
                  setSelected({ ...selected, items });
                  setAddProductId('');
                  setAddProductQty(1);
                }}
                sx={{ width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
              >Agregar</Button>
            </Stack>
            {Array.isArray(selected?.items) && selected?.items.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Imagen</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Cant.</TableCell>
                      <TableCell>Precio (u.)</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selected.items.map((it: any, idx: number) => {
                      const prod = products.find((p: any) => String(p.id) === String(it.productId));
                      const img = (
                        prod?.image ||
                        (Array.isArray(prod?.images) ? prod.images[0] : undefined) ||
                        it?.image ||
                        (Array.isArray(it?.images) ? it.images[0] : undefined)
                      );
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Avatar src={getImageUrl(img)} alt={it.name || it.productId} variant="rounded" sx={{ width: 40, height: 40 }}>
                              <ImageIcon />
                            </Avatar>
                          </TableCell>
                          <TableCell>{it.name || it.productId}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={it.quantity}
                              onChange={e => {
                                const val = Math.max(1, Number(e.target.value));
                                const items = [...selected.items];
                                items[idx].quantity = val;
                                setSelected({ ...selected, items });
                              }}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>${Number(it.price || 0).toFixed(2)}</TableCell>
                          <TableCell>${(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => {
                              const items = selected.items.filter((_: any, i: number) => i !== idx);
                              setSelected({ ...selected, items });
                            }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Sin productos</Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button color="error" onClick={() => setCancelOpen(true)}>Cancelar Pedido</Button>
          <Box
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              ml: { sm: 1 },
            }}
          >
            <Button color="error" onClick={() => selected && deleteOrder(selected)}>
              Eliminar Pedido
            </Button>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button onClick={saveDetails}>Guardar</Button>
          <Button onClick={printInvoice}>Imprimir</Button>
          <Button onClick={closeDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cancelación */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancelar Pedido #{selected?.id}</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo de cancelación"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Explica brevemente el motivo"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Volver</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (!selected) return;
            try {
              // Nuevo flujo: pedir al backend que cancele y restaure stock de forma transaccional
              await salesApi.cancel(selected.id, cancelReason);
              setSales(prev => prev.map(s => s.id === selected.id ? { ...s, status: 'cancelled', cancellationReason: cancelReason } : s));
              setSelected({ ...selected, status: 'cancelled', cancellationReason: cancelReason });
              // Refrescar stocks de productos afectados para reflejar el cambio en UI
              try {
                const items = Array.isArray(selected.items) ? selected.items : [];
                const refreshed: any[] = [];
                for (const it of items) {
                  if (!it?.productId) continue;
                  try {
                    const res = await productsApi.getById(String(it.productId));
                    if (res?.data?.id) refreshed.push(res.data);
                  } catch {}
                }
                if (refreshed.length) {
                  setProducts(prev => {
                    const map = new Map(prev.map((p: any) => [String(p.id), p]));
                    for (const p of refreshed) {
                      const id = String(p.id);
                      const existing = map.get(id) || {};
                      map.set(id, { ...existing, ...p });
                    }
                    return Array.from(map.values());
                  });
                }
              } catch {}
              setCancelOpen(false);
              setCopySnack({ open: true, message: 'Pedido cancelado y stock restaurado', severity: 'success' });
            } catch (e) {
              // Fallback: intentar el método anterior en caso de error del backend
              try {
                await restoreStockForOrder(selected);
                await salesApi.update(selected.id, { status: 'cancelled', cancellationReason: cancelReason });
                setSales(prev => prev.map(s => s.id === selected.id ? { ...s, status: 'cancelled', cancellationReason: cancelReason } : s));
                setSelected({ ...selected, status: 'cancelled', cancellationReason: cancelReason });
                setCancelOpen(false);
                setCopySnack({ open: true, message: 'Pedido cancelado y stock restaurado (fallback)', severity: 'success' });
              } catch {
                setCopySnack({ open: true, message: 'No se pudo cancelar el pedido. Intenta nuevamente.', severity: 'error' });
              }
            }
          }}>Confirmar Cancelación</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de copiado */}
      <Snackbar open={copySnack.open} autoHideDuration={2500} onClose={closeCopySnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeCopySnack} severity={copySnack.severity} sx={{ width: '100%' }}>
          {copySnack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Sales;