import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Tab, Tabs, TextField, Typography, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Switch, FormControl, InputLabel, Select, MenuItem, InputAdornment, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Delete, Save, ContentCopy } from '@mui/icons-material';
import { getStoreLogo, updateStoreLogo } from '../services/storeLogoService';
import { getStoreFavicon, updateStoreFavicon } from '../services/storeFaviconService';
import { addPolicy, deletePolicy, getPolicies, updatePolicy } from '../services/policyService';
import { addCarouselImage, deleteCarouselImage, getCarousel, updateCarouselImage } from '../services/carouselService';
import { StoreLogo } from '../types/storeLogo';
import { StoreFavicon } from '../types/storeFavicon';
import { StorePolicy } from '../types/policy';
import { CarouselImage } from '../types/carousel';
import { StoreGeneral } from '../types/storeGeneral';
import { getStoreGeneral, updateStoreGeneral } from '../services/storeGeneralService';
import { StoreSocial } from '../types/storeSocial';
import { getStoreSocial, updateStoreSocial } from '../services/storeSocialService';
import { StoreShipping, ShippingCarrier, ShippingRate, ShippingScope } from '../types/storeShipping';
import { getStoreShipping, updateStoreShipping } from '../services/storeShippingService';
import { StorePayment } from '../types/storePayment';
import { getStorePayment, updateStorePayment } from '../services/storePaymentService';

function a11yProps(index: number) {
  return {
    id: `store-settings-tab-${index}`,
    'aria-controls': `store-settings-tabpanel-${index}`,
  };
}

const TabPanel: React.FC<{ index: number; value: number; children: React.ReactNode }> = ({ index, value, children }) => {
  if (value !== index) return null;
  return (
    <Box role="tabpanel" id={`store-settings-tabpanel-${index}`} aria-labelledby={`store-settings-tab-${index}`} sx={{ mt: 2 }}>
      {children}
    </Box>
  );
};

const StoreSettings: React.FC = () => {
  const [tab, setTab] = useState(0);
  // General
  const [generalForm, setGeneralForm] = useState<StoreGeneral>({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
  });
  const [generalLoading, setGeneralLoading] = useState(false);
  // Marca
  const [logoForm, setLogoForm] = useState<StoreLogo>({ url: '' });
  const [faviconForm, setFaviconForm] = useState<StoreFavicon>({ url: '' });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  // Políticas
  const [policies, setPolicies] = useState<StorePolicy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<StorePolicy | null>(null);
  // Carrusel
  const [carousel, setCarousel] = useState<CarouselImage[]>([]);
  const [newCarousel, setNewCarousel] = useState<{ imageUrl: string; title: string; description: string }>({ imageUrl: '', title: '', description: '' });
  const newCarouselImgRef = useRef<HTMLInputElement>(null);
  // Social
  const [socialForm, setSocialForm] = useState<StoreSocial>({
    facebook: '',
    instagram: '',
    whatsapp: '',
    x: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
  });
  const [socialLoading, setSocialLoading] = useState(false);
  // Envíos
  const [shippingForm, setShippingForm] = useState<StoreShipping>({ policy: '', standardCost: 0, freeShippingMin: 0, carriers: [], rates: [] });
  const [shippingLoading, setShippingLoading] = useState(false);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newRate, setNewRate] = useState<Omit<ShippingRate, 'id'>>({ scope: 'provincia', region: '', price: 0, carrierId: undefined });
  const [useFreeShipping, setUseFreeShipping] = useState(false);
  const [rateSort, setRateSort] = useState<'none' | 'price-asc' | 'price-desc' | 'region' | 'scope'>('none');
  const [rateFilter, setRateFilter] = useState('');
  // Money input string states to allow typing 3.50 and commas
  const [standardCostInput, setStandardCostInput] = useState('');
  const [freeShippingMinInput, setFreeShippingMinInput] = useState('');
  const [newRatePriceInput, setNewRatePriceInput] = useState('');
  const [ratePriceInputs, setRatePriceInputs] = useState<Record<number, string>>({});
  // UI help
  const [helpOpen, setHelpOpen] = useState(false);

  // Helpers
  const parseDecimal = (value: string) => {
    const normalized = (value || '').replace(',', '.');
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  };
  const onlyDecimalString = (value: string) => {
    // keep digits and at most one separator (dot or comma)
    const cleaned = value.replace(/[^0-9.,]/g, '');
    const parts = cleaned.split(/[.,]/);
    if (parts.length <= 1) return cleaned;
    // join with first separator as dot, ignore further separators
    return parts[0] + '.' + parts.slice(1).join('');
  };
  const formatMoney = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');
  // Pagos
  const [paymentForm, setPaymentForm] = useState<StorePayment>({ info: '', methods: [] });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [newPayment, setNewPayment] = useState<{ key: string; label: string }>({ key: '', label: '' });

  useEffect(() => {
    (async () => {
      try {
        const [gen, lg, fv, pol, car, soc, shp, pay] = await Promise.all([
          getStoreGeneral(),
          getStoreLogo(),
          getStoreFavicon(),
          getPolicies(),
          getCarousel(),
          getStoreSocial(),
          getStoreShipping(),
          getStorePayment(),
        ]);
        setGeneralForm(gen);
        setLogoForm(lg);
        setFaviconForm(fv);
        setPolicies(pol);
        setCarousel(car);
        setSocialForm(soc);
        const carriers = Array.isArray((shp as any).carriers) ? (shp as any).carriers : [];
        const carrierIds = new Set(carriers.map((c: any) => c.id));
        const rates = Array.isArray((shp as any).rates) ? (shp as any).rates : [];
        // Clean rates: if carrierId doesn't exist in carriers, set to undefined
        const cleanedRates = rates.map((r: any) => ({
          ...r,
          carrierId: r.carrierId && carrierIds.has(r.carrierId) ? r.carrierId : undefined,
        }));
        const normalizedShipping = {
          policy: shp.policy || '',
          standardCost: Number(shp.standardCost ?? 0),
          freeShippingMin: Number(shp.freeShippingMin ?? 0),
          carriers,
          rates: cleanedRates,
        } as StoreShipping;
        setShippingForm(normalizedShipping);
        setUseFreeShipping((normalizedShipping.freeShippingMin ?? 0) > 0);
        // initialize money inputs
        setStandardCostInput(formatMoney(Number(normalizedShipping.standardCost || 0)));
        setFreeShippingMinInput(formatMoney(Number(normalizedShipping.freeShippingMin || 0)));
        setRatePriceInputs(Object.fromEntries((normalizedShipping.rates || []).map(r => [r.id, formatMoney(Number(r.price || 0))])));
        setPaymentForm({
          info: pay.info || '',
          methods: Array.isArray(pay.methods) ? pay.methods : [],
        });
      } catch (e) {
        console.error('Error loading store settings', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // General
  const handleSaveGeneral = async () => {
    setGeneralLoading(true);
    try {
      const saved = await updateStoreGeneral(generalForm);
      setGeneralForm(saved);
    } finally {
      setGeneralLoading(false);
    }
  };

  // Marca
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoForm({ url: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveLogo = () => {
    setLogoForm({ url: '' });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };
  const handleFaviconFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFaviconForm({ url: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveFavicon = () => {
    setFaviconForm({ url: '' });
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  };
  const handleSaveBranding = async () => {
    const [lg, fv] = await Promise.all([
      updateStoreLogo(logoForm),
      updateStoreFavicon(faviconForm),
    ]);
    setLogoForm(lg);
    setFaviconForm(fv);
  };

  // Políticas
  const handleSavePolicy = async () => {
    if (!editingPolicy) return;
    const { id, title, content } = editingPolicy;
    const updated = await updatePolicy(id, { title, content });
    setPolicies(prev => prev.map(p => (p.id === id ? updated : p)));
    setEditingPolicy(null);
  };
  const handleAddPolicy = async () => {
    const created = await addPolicy({ title: 'Nueva Política', content: '' });
    setPolicies(prev => [...prev, created]);
    setEditingPolicy(created);
  };
  const handleDeletePolicy = async (id: number) => {
    await deletePolicy(id);
    setPolicies(prev => prev.filter(p => p.id !== id));
    if (editingPolicy?.id === id) setEditingPolicy(null);
  };

  // Carrusel
  const handleNewCarouselFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewCarousel((prev) => ({ ...prev, imageUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveNewCarouselImg = () => {
    setNewCarousel((prev) => ({ ...prev, imageUrl: '' }));
    if (newCarouselImgRef.current) newCarouselImgRef.current.value = '';
  };
  const handleEditCarouselFile = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCarousel((prev) => prev.map(x => x.id === id ? { ...x, imageUrl: ev.target?.result as string } : x));
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveEditCarouselImg = (id: number) => {
    setCarousel((prev) => prev.map(x => x.id === id ? { ...x, imageUrl: '' } : x));
  };
  const handleAddCarousel = async () => {
    if (!newCarousel.imageUrl) return;
    const created = await addCarouselImage(newCarousel);
    setCarousel(prev => [...prev, created]);
    setNewCarousel({ imageUrl: '', title: '', description: '' });
  };
  const handleUpdateCarousel = async (img: CarouselImage) => {
    const updated = await updateCarouselImage(img.id, img);
    setCarousel(prev => prev.map(c => (c.id === img.id ? updated : c)));
  };
  const handleDeleteCarousel = async (id: number) => {
    await deleteCarouselImage(id);
    setCarousel(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveSocial = async () => {
    setSocialLoading(true);
    try {
      const saved = await updateStoreSocial(socialForm);
      setSocialForm(saved);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSaveShipping = async () => {
    setShippingLoading(true);
    try {
      const normalizedRates = shippingForm.rates.map(r => ({
        ...r,
        price: Number(r.price ?? 0),
      }));
      const payload: StoreShipping = {
        ...shippingForm,
        standardCost: parseDecimal(standardCostInput || String(shippingForm.standardCost)),
        freeShippingMin: useFreeShipping ? parseDecimal(freeShippingMinInput || String(shippingForm.freeShippingMin)) : 0,
        rates: normalizedRates,
      };
      const saved = await updateStoreShipping(payload);
      setShippingForm(saved);
      setUseFreeShipping((saved.freeShippingMin ?? 0) > 0);
    } finally {
      setShippingLoading(false);
    }
  };

  // Shipping helpers
  const nextId = (arr: { id: number }[]) => (arr.length ? Math.max(...arr.map(x => Number(x.id))) + 1 : 1);
  const handleAddCarrier = () => {
    const name = newCarrierName.trim();
    if (!name) return;
    const carrier: ShippingCarrier = { id: nextId(shippingForm.carriers), name, enabled: true };
    setShippingForm(f => ({ ...f, carriers: [...f.carriers, carrier] }));
    setNewCarrierName('');
  };
  const handleToggleCarrier = (id: number, enabled: boolean) => {
    setShippingForm(f => ({ ...f, carriers: f.carriers.map(c => c.id === id ? { ...c, enabled } : c) }));
  };
  const handleDeleteCarrier = (id: number) => {
    const carrier = shippingForm.carriers.find(c => c.id === id);
    if (!carrier) return;
    const confirmText = `¿Eliminar el transportista "${carrier.name}"? Las tarifas asociadas quedarán sin transportista.`;
    if (!window.confirm(confirmText)) return;
    setShippingForm(f => ({
      ...f,
      carriers: f.carriers.filter(c => c.id !== id),
      rates: f.rates.map(r => r.carrierId === id ? { ...r, carrierId: undefined } : r),
    }));
  };
  const handleAddRate = () => {
    const region = newRate.region.trim();
    if (!region) return;
    const rate: ShippingRate = { id: nextId(shippingForm.rates), ...newRate, price: Number(newRate.price || 0) } as ShippingRate;
    setShippingForm(f => ({ ...f, rates: [...f.rates, rate] }));
    setRatePriceInputs(m => ({ ...m, [rate.id]: formatMoney(Number(rate.price || 0)) }));
    setNewRate({ scope: 'provincia', region: '', price: 0, carrierId: undefined });
    setNewRatePriceInput('');
  };
  const handleUpdateRate = (id: number, data: Partial<ShippingRate>) => {
    setShippingForm(f => ({ ...f, rates: f.rates.map(r => r.id === id ? { ...r, ...data } : r) }));
  };
  const handleDeleteRate = (id: number) => {
    const rate = shippingForm.rates.find(r => r.id === id);
    if (!rate) return;
    const label = `${rate.scope} - ${rate.region}${rate.price ? ` ($${rate.price.toFixed(2)})` : ''}`;
    if (!window.confirm(`¿Eliminar la tarifa ${label}?`)) return;
    setShippingForm(f => ({ ...f, rates: f.rates.filter(r => r.id !== id) }));
    setRatePriceInputs(m => {
      const n = { ...m };
      delete n[id];
      return n;
    });
  };

  const handleDuplicateRate = (id: number) => {
    const rate = shippingForm.rates.find(r => r.id === id);
    if (!rate) return;
    const newId = nextId(shippingForm.rates);
    const copy: ShippingRate = { ...rate, id: newId };
    setShippingForm(f => ({ ...f, rates: [...f.rates, copy] }));
    setRatePriceInputs(m => ({ ...m, [newId]: formatMoney(Number(copy.price || 0)) }));
  };

  const displayedRates = useMemo(() => {
    let items = [...shippingForm.rates];
    if (rateFilter.trim()) {
      const q = rateFilter.toLowerCase();
      items = items.filter(r => r.region.toLowerCase().includes(q));
    }
    switch (rateSort) {
      case 'price-asc':
        items.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price-desc':
        items.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'region':
        items.sort((a, b) => a.region.localeCompare(b.region));
        break;
      case 'scope':
        items.sort((a, b) => a.scope.localeCompare(b.scope));
        break;
      default:
        break;
    }
    return items;
  }, [shippingForm.rates, rateFilter, rateSort]);

  const handleSavePayment = async () => {
    setPaymentLoading(true);
    try {
      const saved = await updateStorePayment(paymentForm);
      setPaymentForm(saved);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    const key = newPayment.key.trim().toLowerCase();
    const label = newPayment.label.trim();
    if (!key || !label) return;
    if (paymentForm.methods.some(m => m.key === key)) return;
    setPaymentForm(f => ({ ...f, methods: [...f.methods, { key, label, enabled: true }] }));
    setNewPayment({ key: '', label: '' });
  };
  const handleEditPaymentMethod = (key: string, field: 'key' | 'label', value: string) => {
    setPaymentForm(f => ({
      ...f,
      methods: f.methods.map(m => m.key === key ? { ...m, [field]: value } : m)
    }));
  };
  const handleDeletePaymentMethod = (key: string) => {
    setPaymentForm(f => ({ ...f, methods: f.methods.filter(m => m.key !== key) }));
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 3, background: 'linear-gradient(90deg, #f5f7fa 60%, #e3e3e3 100%)' }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
            Configuración de la Tienda
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
            Personaliza la apariencia, marca, políticas y carrusel de tu tienda online.
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            aria-label="store settings tabs"
            sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="General" {...a11yProps(0)} />
            <Tab label="Marca" {...a11yProps(1)} />
            <Tab label="Políticas" {...a11yProps(2)} />
            <Tab label="Carrusel" {...a11yProps(3)} />
            <Tab label="Redes Sociales" {...a11yProps(4)} />
            <Tab label="Envíos" {...a11yProps(5)} />
            <Tab label="Métodos de pago" {...a11yProps(6)} />
          </Tabs>
          {/* General */}
          <TabPanel index={0} value={tab}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Información General</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Edita los datos principales de tu tienda. Estos datos se mostrarán en el sitio y comunicaciones.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Nombre de la tienda" value={generalForm.name ?? ''} onChange={e => setGeneralForm(f => ({ ...f, name: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Email de contacto" value={generalForm.email ?? ''} onChange={e => setGeneralForm(f => ({ ...f, email: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Teléfono" value={generalForm.phone ?? ''} onChange={e => setGeneralForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Dirección" value={generalForm.address ?? ''} onChange={e => setGeneralForm(f => ({ ...f, address: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField label="Descripción" value={generalForm.description ?? ''} onChange={e => setGeneralForm(f => ({ ...f, description: e.target.value }))} fullWidth multiline minRows={2} />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Contenido página Nosotros
                        </Typography>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden', background: '#fff' }}>
                          <ReactQuill
                            value={generalForm.about ?? ''}
                            onChange={value => setGeneralForm(f => ({ ...f, about: value }))}
                            theme="snow"
                            style={{ height: '200px', background: '#fff' }}
                            placeholder="Escribe la historia, misión, visión o valores de tu tienda."
                            modules={{
                              toolbar: [
                                [{ 'header': [1, 2, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['link', 'image'],
                                ['clean']
                              ]
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Contenido página Contacto
                        </Typography>
                        <Box sx={{ border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden', background: '#fff' }}>
                          <ReactQuill
                            value={generalForm.contact ?? ''}
                            onChange={value => setGeneralForm(f => ({ ...f, contact: value }))}
                            theme="snow"
                            style={{ height: '200px', background: '#fff' }}
                            placeholder="Agrega información de contacto, horarios, ubicación, etc."
                            modules={{
                              toolbar: [
                                [{ 'header': [1, 2, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['link', 'image'],
                                ['clean']
                              ]
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                      <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveGeneral} sx={{ borderRadius: 2, fontWeight: 600 }} disabled={generalLoading}>
                        Guardar cambios
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Métodos de pago */}
          <TabPanel index={6} value={tab}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Métodos de pago</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Activa, edita, elimina o agrega métodos disponibles y añade información para tus clientes.
                    </Typography>
                    <TextField
                      label="Información para el cliente"
                      value={paymentForm.info ?? ''}
                      onChange={e => setPaymentForm(f => ({ ...f, info: e.target.value }))}
                      fullWidth
                      multiline
                      minRows={3}
                      sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Clave interna (ej: efectivo, transferencia)" value={newPayment.key ?? ''} onChange={e => setNewPayment(p => ({ ...p, key: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Etiqueta para mostrar" value={newPayment.label ?? ''} onChange={e => setNewPayment(p => ({ ...p, label: e.target.value }))} fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'stretch' }}>
                        <Button variant="contained" color="primary" onClick={handleAddPaymentMethod} fullWidth>Agregar</Button>
                      </Grid>
                    </Grid>
                    <List>
                      {(paymentForm.methods || []).map(m => (
                        <ListItem key={m.key} sx={{ alignItems: 'stretch', flexDirection: 'column' }}
                          secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">Activo</Typography>
                              <Switch checked={m.enabled} onChange={(_, v) => setPaymentForm(f => ({ ...f, methods: f.methods.map(x => x.key === m.key ? { ...x, enabled: v } : x) }))} />
                              <IconButton aria-label="Eliminar" onClick={() => handleDeletePaymentMethod(m.key)}><Delete /></IconButton>
                            </Box>
                          }>
                          <Grid container spacing={2} alignItems="flex-start" sx={{ width: '100%', mb: 1 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField label="Clave interna" value={m.key ?? ''} onChange={e => handleEditPaymentMethod(m.key, 'key', e.target.value)} fullWidth />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                              <TextField label="Etiqueta" value={m.label ?? ''} onChange={e => handleEditPaymentMethod(m.key, 'label', e.target.value)} fullWidth />
                            </Grid>
                            {(m.key === 'transferencia' || m.key === 'deposito') && (
                              <>
                                <Grid item xs={12}>
                                  <TextField
                                    label="Instrucciones para el cliente"
                                    value={m.instructions || ''}
                                    onChange={e => setPaymentForm(f => ({ ...f, methods: f.methods.map(x => x.key === m.key ? { ...x, instructions: e.target.value } : x) }))}
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    helperText="Se mostrará junto a los datos bancarios al confirmar el pedido"
                                  />
                                </Grid>
                                <Grid item xs={12}>
                                  <TextField
                                    label="Información bancaria"
                                    value={m.bankInfo || ''}
                                    onChange={e => setPaymentForm(f => ({ ...f, methods: f.methods.map(x => x.key === m.key ? { ...x, bankInfo: e.target.value } : x) }))}
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    placeholder={"Banco Ejemplo\nCuenta Corriente: 123456789\nTitular: Nombre de la empresa\nRUC: 1234567890\nEmail: pagos@ejemplo.com"}
                                  />
                                </Grid>
                              </>
                            )}
                          </Grid>
                        </ListItem>
                      ))}
                    </List>

                    {paymentForm.methods.some(m => m.key === 'paypal') && (
                      <Box sx={{ mt: 4, p: 3, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #2196f3' }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">
                          Configuración de PayPal
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Configura tus credenciales de PayPal para recibir pagos directamente en tu cuenta.
                        </Typography>
                        <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={600} gutterBottom>
                            Cómo obtener las credenciales:
                          </Typography>
                          <Typography variant="body2">
                            1. Ve a developer.paypal.com/dashboard
                          </Typography>
                          <Typography variant="body2">
                            2. Crea una app en Apps y Credentials
                          </Typography>
                          <Typography variant="body2">
                            3. Copia el Client ID y Secret
                          </Typography>
                          <Typography variant="body2">
                            4. Para pruebas usa Sandbox, para producción usa Live
                          </Typography>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              label="PayPal Client ID"
                              value={paymentForm.paypalClientId || ''}
                              onChange={e => setPaymentForm(f => ({ ...f, paypalClientId: e.target.value }))}
                              fullWidth
                              placeholder="Ej: AeB1234567890abcdefghijklmnopqrstuvwxyz"
                              helperText="El Client ID que obtuviste de PayPal Developer Dashboard"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              label="PayPal Client Secret"
                              type="password"
                              value={paymentForm.paypalClientSecret || ''}
                              onChange={e => setPaymentForm(f => ({ ...f, paypalClientSecret: e.target.value }))}
                              fullWidth
                              placeholder="Mantén esto en secreto"
                              helperText="El Secret que obtuviste de PayPal Developer Dashboard"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              select
                              label="Modo de PayPal"
                              value={paymentForm.paypalMode || 'sandbox'}
                              onChange={e => setPaymentForm(f => ({ ...f, paypalMode: e.target.value as 'sandbox' | 'live' }))}
                              fullWidth
                              helperText="Usa Sandbox para pruebas, Live para producción"
                            >
                              <MenuItem value="sandbox">Sandbox (Pruebas)</MenuItem>
                              <MenuItem value="live">Live (Producción)</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            Importante:
                          </Typography>
                          <Typography variant="body2">
                            Asegúrate de guardar los cambios después de configurar PayPal. Los pagos irán directamente a la cuenta de PayPal asociada con estas credenciales.
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSavePayment} sx={{ borderRadius: 2, fontWeight: 600 }} disabled={paymentLoading}>
                        Guardar cambios
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>


      {/* Marca */}
      <TabPanel index={1} value={tab}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Logo</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sube el logo de tu tienda o pega una URL. Se recomienda fondo transparente y formato PNG.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" color="primary" component="label" sx={{ textTransform: 'none', fontWeight: 500 }}>
                      Subir logo
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={logoInputRef}
                        onChange={handleLogoFile}
                      />
                    </Button>
                    {logoForm.url && (
                      <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #f5f7fa 60%, #e3e3e3 100%)',
                        boxShadow: 2,
                        border: '2px solid #e0e0e0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img src={logoForm.url} alt="Logo" style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }} />
                        <IconButton size="small" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', boxShadow: 1 }} onClick={handleRemoveLogo}><Delete fontSize="small" /></IconButton>
                      </Box>
                    )}
                  </Box>
                  <TextField
                    label="URL del Logo"
                    value={logoForm.url}
                    onChange={(e) => setLogoForm({ url: e.target.value })}
                    fullWidth
                    sx={{ mt: 2, maxWidth: 320 }}
                  />
                </Box>

              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Favicon</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sube el favicon (icono de pestaña) o pega una URL. Tamaño recomendado: 32x32px.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" color="primary" component="label" sx={{ textTransform: 'none', fontWeight: 500 }}>
                      Subir favicon
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        ref={faviconInputRef}
                        onChange={handleFaviconFile}
                      />
                    </Button>
                    {faviconForm.url && (
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '30%',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #f5f7fa 60%, #e3e3e3 100%)',
                        boxShadow: 2,
                        border: '2px solid #e0e0e0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img src={faviconForm.url} alt="Favicon" style={{ width: '70%', height: '70%', objectFit: 'contain', display: 'block' }} />
                        <IconButton size="small" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper', boxShadow: 1 }} onClick={handleRemoveFavicon}><Delete fontSize="small" /></IconButton>
                      </Box>
                    )}
                  </Box>
                  <TextField
                    label="URL del Favicon"
                    value={faviconForm.url}
                    onChange={(e) => setFaviconForm({ url: e.target.value })}
                    fullWidth
                    sx={{ mt: 2, maxWidth: 320 }}
                  />
                </Box>

              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" color="primary" size="large" startIcon={<Save />} onClick={handleSaveBranding} sx={{ borderRadius: 2, fontWeight: 600 }}>
                Guardar cambios
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Políticas */}
      <TabPanel index={2} value={tab}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600} color="primary.main">Políticas</Typography>
                  <Button size="small" variant="contained" color="primary" startIcon={<Add />} onClick={handleAddPolicy} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Nueva
                  </Button>
                </Box>
                <List>
                  {(policies || []).map((p) => (
                    <ListItem key={p.id} button onClick={() => setEditingPolicy(p)}>
                      <ListItemText primary={p.title} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleDeletePolicy(p.id)} aria-label="Eliminar"><Delete /></IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Editor</Typography>
                {editingPolicy ? (
                  <>
                    <TextField
                      label="Título"
                      value={editingPolicy.title}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ mb: 2 }}>
                      <ReactQuill
                        value={editingPolicy.content}
                        onChange={value => setEditingPolicy({ ...editingPolicy, content: value })}
                        theme="snow"
                        style={{ height: '200px', background: '#fff' }}
                        placeholder="Escribe el contenido de la política."
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                          ]
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSavePolicy} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Guardar cambios
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">Selecciona una política para editar.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Carrusel */}
      <TabPanel index={3} value={tab}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Nuevo slide</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sube una imagen para el carrusel, o pega una URL. Añade título y descripción para destacar promociones o mensajes.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Button variant="outlined" component="label">
                        Subir imagen
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          ref={newCarouselImgRef}
                          onChange={handleNewCarouselFile}
                        />
                      </Button>
                      {newCarousel.imageUrl && (
                        <Box sx={{ width: 64, height: 64, border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', position: 'relative' }}>
                          <img src={newCarousel.imageUrl} alt="Slide" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          <IconButton size="small" sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.default' }} onClick={handleRemoveNewCarouselImg}><Delete fontSize="small" /></IconButton>
                        </Box>
                      )}
                    </Box>
                    <TextField label="Imagen URL" value={newCarousel.imageUrl} onChange={(e) => setNewCarousel({ ...newCarousel, imageUrl: e.target.value })} fullWidth sx={{ mt: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Título" value={newCarousel.title} onChange={(e) => setNewCarousel({ ...newCarousel, title: e.target.value })} fullWidth />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Descripción" value={newCarousel.description} onChange={(e) => setNewCarousel({ ...newCarousel, description: e.target.value })} fullWidth />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAddCarousel} sx={{ borderRadius: 2, fontWeight: 600 }}>
                    Agregar slide
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Slides</Typography>
                <List>
                  {(carousel || []).map((c) => (
                    <ListItem key={c.id}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button variant="outlined" component="label" size="small">
                              Subir imagen
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => handleEditCarouselFile(c.id, e)}
                              />
                            </Button>
                            {c.imageUrl && (
                              <Box sx={{ width: 64, height: 64, border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', position: 'relative' }}>
                                <img src={c.imageUrl} alt="Slide" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                <IconButton size="small" sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'background.default' }} onClick={() => handleRemoveEditCarouselImg(c.id)}><Delete fontSize="small" /></IconButton>
                              </Box>
                            )}
                          </Box>
                          <TextField label="Imagen URL" value={c.imageUrl} onChange={(e) => setCarousel(prev => prev.map(x => x.id === c.id ? { ...x, imageUrl: e.target.value } : x))} fullWidth sx={{ mt: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField label="Título" value={c.title} onChange={(e) => setCarousel(prev => prev.map(x => x.id === c.id ? { ...x, title: e.target.value } : x))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField label="Descripción" value={c.description} onChange={(e) => setCarousel(prev => prev.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton aria-label="Guardar" onClick={() => handleUpdateCarousel(c)}><Save /></IconButton>
                          <IconButton aria-label="Eliminar" onClick={() => handleDeleteCarousel(c.id)}><Delete /></IconButton>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Redes Sociales */}
      <TabPanel index={4} value={tab}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Redes Sociales</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Agrega o edita los enlaces de tus redes sociales para que tus clientes puedan encontrarte fácilmente.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><TextField label="Facebook" value={socialForm.facebook} onChange={e => setSocialForm(f => ({ ...f, facebook: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="Instagram" value={socialForm.instagram} onChange={e => setSocialForm(f => ({ ...f, instagram: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="WhatsApp" value={socialForm.whatsapp} onChange={e => setSocialForm(f => ({ ...f, whatsapp: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="X (Twitter)" value={socialForm.x} onChange={e => setSocialForm(f => ({ ...f, x: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="TikTok" value={socialForm.tiktok} onChange={e => setSocialForm(f => ({ ...f, tiktok: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="YouTube" value={socialForm.youtube} onChange={e => setSocialForm(f => ({ ...f, youtube: e.target.value }))} fullWidth /></Grid>
                  <Grid item xs={12} sm={6}><TextField label="LinkedIn" value={socialForm.linkedin} onChange={e => setSocialForm(f => ({ ...f, linkedin: e.target.value }))} fullWidth /></Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveSocial} sx={{ borderRadius: 2, fontWeight: 600 }} disabled={socialLoading}>
                    Guardar cambios
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>


      {/* Envíos */}
      <TabPanel index={5} value={tab}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Configuración de envíos</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Define costo estándar y umbral de envío gratis.
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={() => setHelpOpen(true)}>
                      ¿Cómo funciona?
                    </Button>
                  }
                >
                  Las tarifas que configures aquí aparecerán como métodos de envío en el checkout de tu tienda. El cliente podrá elegir un método y su costo se sumará al total.
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      size="small"
                      label="Costo estándar"
                      type="text"
                      inputMode="decimal"
                      inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
                      value={standardCostInput}
                      onChange={e => setStandardCostInput(onlyDecimalString(e.target.value))}
                      onBlur={() => setShippingForm(f => ({ ...f, standardCost: parseDecimal(standardCostInput) }))}
                      fullWidth
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      helperText="Costo base si no aplica una tarifa específica"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Switch checked={useFreeShipping} onChange={(_, v) => setUseFreeShipping(v)} />
                      <TextField
                        size="small"
                        label="Envío gratis desde"
                        type="text"
                        inputMode="decimal"
                        inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
                        value={useFreeShipping ? freeShippingMinInput : ''}
                        onChange={e => setFreeShippingMinInput(onlyDecimalString(e.target.value))}
                        onBlur={() => setShippingForm(f => ({ ...f, freeShippingMin: useFreeShipping ? parseDecimal(freeShippingMinInput) : 0 }))}
                        fullWidth
                        disabled={!useFreeShipping}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        helperText={useFreeShipping ? 'Pedidos iguales o superiores son gratis' : 'Desactivado'}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Transportistas</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField label="Nombre del transportista" value={newCarrierName} onChange={e => setNewCarrierName(e.target.value)} fullWidth size="small" />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Button variant="contained" onClick={handleAddCarrier} size="small" fullWidth>Agregar</Button>
                  </Grid>
                </Grid>
                {shippingForm.carriers.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Aún no has agregado transportistas. Agrega uno para asociarlo a tus tarifas.
                  </Typography>
                )}
                <List>
                  {(shippingForm.carriers || []).map(c => (
                    <ListItem key={c.id} secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">Activo</Typography>
                        <Switch checked={c.enabled} onChange={(_, v) => handleToggleCarrier(c.id, v)} />
                        <IconButton aria-label="Eliminar" onClick={() => handleDeleteCarrier(c.id)}><Delete /></IconButton>
                      </Box>
                    }>
                      <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">Tarifas por región</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="scope-label">Ámbito</InputLabel>
                      <Select labelId="scope-label" label="Ámbito" value={newRate.scope} onChange={e => setNewRate(r => ({ ...r, scope: e.target.value as ShippingScope }))}>
                        <MenuItem value="provincia">Provincia</MenuItem>
                        <MenuItem value="ciudad">Ciudad</MenuItem>
                      </Select>
                      <Box sx={{ height: '21px', display: { xs: 'none', sm: 'block' } }} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      size="small"
                      label="Región"
                      placeholder="Ecuador / Pichincha / Quito"
                      value={newRate.region}
                      onChange={e => setNewRate(r => ({ ...r, region: e.target.value }))}
                      fullWidth
                      error={!newRate.region.trim()}
                      helperText={!newRate.region.trim() ? 'Requerido' : ' '}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2.5}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="carrier-label">Transportista</InputLabel>
                      <Select labelId="carrier-label" label="Transportista" value={newRate.carrierId ?? ''} onChange={e => setNewRate(r => ({ ...r, carrierId: e.target.value === '' ? undefined : Number(e.target.value) }))}>
                        <MenuItem value="">Sin transportista</MenuItem>
                        {(shippingForm.carriers || []).filter(c => c.enabled).map(c => (
                          <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                      </Select>
                      <Box sx={{ height: '21px', display: { xs: 'none', sm: 'block' } }} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      size="small"
                      label="Precio"
                      type="text"
                      inputMode="decimal"
                      inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
                      value={newRatePriceInput}
                      onChange={e => setNewRatePriceInput(onlyDecimalString(e.target.value))}
                      onBlur={() => setNewRate(r => ({ ...r, price: parseDecimal(newRatePriceInput) }))}
                      fullWidth
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                    <Box sx={{ height: '21px', display: { xs: 'none', sm: 'block' } }} />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddRate}
                      fullWidth
                      size="small"
                      disabled={!newRate.region.trim()}
                      sx={{ height: 40, mb: { xs: 0, sm: '21px' } }}
                    >
                      Agregar
                    </Button>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Buscar por región" value={rateFilter} onChange={e => setRateFilter(e.target.value)} fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="sort-label">Ordenar por</InputLabel>
                      <Select labelId="sort-label" label="Ordenar por" value={rateSort} onChange={e => setRateSort(e.target.value as any)}>
                        <MenuItem value="none">Sin orden</MenuItem>
                        <MenuItem value="price-asc">Precio: menor a mayor</MenuItem>
                        <MenuItem value="price-desc">Precio: mayor a menor</MenuItem>
                        <MenuItem value="region">Región (A-Z)</MenuItem>
                        <MenuItem value="scope">Ámbito</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {displayedRates.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No hay tarifas registradas para mostrar.</Typography>
                )}

                <List>
                  {(displayedRates || []).map(r => (
                    <ListItem key={r.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={2.5}>
                          <FormControl fullWidth size="small">
                            <InputLabel id={`scope-${r.id}`}>Ámbito</InputLabel>
                            <Select labelId={`scope-${r.id}`} label="Ámbito" value={r.scope} onChange={e => handleUpdateRate(r.id, { scope: e.target.value as ShippingScope })}>
                              <MenuItem value="provincia">Provincia</MenuItem>
                              <MenuItem value="ciudad">Ciudad</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            size="small"
                            label="Región"
                            value={r.region}
                            onChange={e => handleUpdateRate(r.id, { region: e.target.value })}
                            fullWidth
                            error={!r.region.trim()}
                            helperText={!r.region.trim() ? 'Requerido' : ' '}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2.5}>
                          <FormControl fullWidth size="small">
                            <InputLabel id={`carrier-${r.id}`}>Transportista</InputLabel>
                            <Select labelId={`carrier-${r.id}`} label="Transportista" value={shippingForm.carriers.some(c => c.id === r.carrierId) ? (r.carrierId ?? '') : ''} onChange={e => handleUpdateRate(r.id, { carrierId: e.target.value === '' ? undefined : Number(e.target.value) })}>
                              <MenuItem value="">Sin transportista</MenuItem>
                              {(shippingForm.carriers || []).filter(c => c.enabled).map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <TextField
                            size="small"
                            label="Precio"
                            type="text"
                            inputMode="decimal"
                            inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
                            value={ratePriceInputs[r.id] ?? formatMoney(Number(r.price || 0))}
                            onChange={e => setRatePriceInputs(m => ({ ...m, [r.id]: onlyDecimalString(e.target.value) }))}
                            onBlur={() => handleUpdateRate(r.id, { price: parseDecimal(ratePriceInputs[r.id] ?? '') })}
                            fullWidth
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            helperText={(parseDecimal(ratePriceInputs[r.id] ?? formatMoney(Number(r.price || 0))) === 0) ? 'Gratis' : ' '}
                          />
                        </Grid>
                        <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <IconButton aria-label="Duplicar" color="primary" size="small" onClick={() => handleDuplicateRate(r.id)} title="Duplicar">
                            <ContentCopy fontSize="small" />
                          </IconButton>
                          <IconButton aria-label="Eliminar" color="error" size="small" onClick={() => handleDeleteRate(r.id)} title="Eliminar">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveShipping} sx={{ borderRadius: 2, fontWeight: 600 }} disabled={shippingLoading}>
                    Guardar cambios
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      {/* Ayuda Envíos */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100vh - 32px)', sm: '90vh' },
            width: { xs: 'calc(100vw - 32px)', sm: 'auto' },
            maxWidth: { xs: 'calc(100vw - 32px)', sm: '600px' },
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              lineHeight: 1.4,
              whiteSpace: 'normal',
            }}
          >
            Cómo funcionan las tarifas de envío
          </Typography>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, sm: 2 } }}>
            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                }}
              >
                1) Crea transportistas
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                Añade transportistas (ej. Servientrega, Correo Nacional) y actívalos. Solo los activos aparecerán para asociar tarifas.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                }}
              >
                2) Define tarifas por región
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                Elige el ámbito (Provincia/Ciudad), escribe la región (Ecuador, Pichincha, Quito) y un precio. Precio 0 = Envío gratis.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                }}
              >
                3) Configura envío gratis y costo estándar
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                Si activas envío gratis desde un monto, cuando el pedido supere ese umbral el envío será $0. Si no aplica ninguna tarifa, se usa el costo estándar.
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                }}
              >
                4) Checkout de la tienda
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                En el checkout, los métodos se generan con las tarifas configuradas. El cliente elige uno y su costo se suma al total. Si el pedido supera el umbral de envío gratis, el costo es $0.
              </Typography>
            </Box>

            <Box sx={{
              bgcolor: 'action.hover',
              p: { xs: 1.5, sm: 2 },
              borderRadius: 1,
              borderLeft: 3,
              borderColor: 'primary.main'
            }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                  whiteSpace: 'normal',
                }}
              >
                💡 Tip: puedes duplicar tarifas para crear variantes rápidas por región y ordenar/filtrar para administrarlas mejor.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
          <Button
            onClick={() => setHelpOpen(false)}
            autoFocus
            variant="contained"
            fullWidth
            sx={{ display: { xs: 'block', sm: 'none' } }}
          >
            Aceptar
          </Button>
          <Button
            onClick={() => setHelpOpen(false)}
            autoFocus
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreSettings;
