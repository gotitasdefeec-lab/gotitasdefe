

import React, { useState } from 'react';
import { Button, TextField, Alert, Box, Typography, IconButton, InputAdornment, CircularProgress, Fade } from '@mui/material';
import { Visibility, VisibilityOff, MailOutline, Lock } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import { useApp } from '../context/AppContext';
import { login } from '../services/authService';

// const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || '';
// const ADMIN_PASSWORD = localStorage.getItem('adminPassword') || process.env.REACT_APP_ADMIN_PASSWORD || '';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const apiUser = await login(email, password);
      const user = { 
        id: String(apiUser.id), 
        name: apiUser.name, 
        email: apiUser.email, 
        role: 'admin' as const 
      };
      setCurrentUser(user);
      // Calcular ruta de retorno: 1) query redirect, 2) state.from, 3) dashboard
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      const fromState = (location.state as any)?.from?.pathname as string | undefined;
      const target = redirectParam || fromState || '/';
      navigate(target);
    } catch (apiErr: any) {
      setError(apiErr.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Fade in={!!error} timeout={300} unmountOnExit>
        <Alert
          severity="error"
          variant="outlined"
          sx={{
            mb: 2,
            borderRadius: 2,
            borderColor: 'error.light',
            background: 'rgba(244,67,54,0.06)',
            fontSize: { xs: '0.83rem', sm: '0.875rem' },
          }}
        >
          {error}
        </Alert>
      </Fade>
      <form onSubmit={handleSubmit} autoComplete="off">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.primary', fontWeight: 600 }}>
              Correo electrónico
            </Typography>
            <TextField
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            fullWidth
            required
            autoFocus
            disabled={loading}
            placeholder="admin@tienda.com"
            inputProps={{ 'aria-label': 'Correo electrónico', autoComplete: 'username' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutline fontSize="small" color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              background: '#f7fafd',
              borderRadius: 2,
              '& .MuiInputBase-root': {
                borderRadius: 2,
                fontSize: { xs: '15px', sm: '0.95rem' },
                minHeight: { xs: '46px', sm: '52px' },
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 2px rgba(33,150,243,0.25)',
              },
            }}
          /></Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.primary', fontWeight: 600 }}>
              Contraseña
            </Typography>
            <TextField
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            fullWidth
            required
            disabled={loading}
            placeholder="••••••••"
            inputProps={{ 
              'aria-label': 'Contraseña', 
              autoComplete: 'current-password'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Mostrar/ocultar contraseña"
                    onClick={() => setShowPassword(s => !s)}
                    edge="end"
                    size="small"
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              background: '#f7fafd',
              borderRadius: 2,
              '& .MuiInputBase-root': {
                borderRadius: 2,
                fontSize: { xs: '15px', sm: '0.95rem' },
                minHeight: { xs: '46px', sm: '52px' },
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 2px rgba(123,31,162,0.25)',
              },
              // Ocultar el icono nativo del navegador (Edge, Chrome, IE)
              '& input::-ms-reveal, & input::-ms-clear': {
                display: 'none !important',
              },
              '& input::-webkit-credentials-auto-fill-button': {
                display: 'none !important',
              },
            }}
          />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Seguridad activa: token versión / sesiones seguras
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !email || !password}
            sx={{
              mt: 0.5,
              py: { xs: 1.4, sm: 1.15 },
              fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1rem' },
              minHeight: { xs: '46px', sm: '48px' },
              background: 'linear-gradient(90deg, #1976d2 0%, #7b1fa2 100%)',
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.12)',
              borderRadius: 2.5,
              letterSpacing: 0.8,
              position: 'relative',
              overflow: 'hidden',
              '&:before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                transform: 'translateX(-100%)',
                animation: loading ? 'none' : 'shine 3.2s infinite',
              },
              '@keyframes shine': {
                '0%': { transform: 'translateX(-100%)' },
                '60%': { transform: 'translateX(100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
              '&:hover': {
                background: 'linear-gradient(90deg, #1565c0 0%, #6a1b9a 100%)',
              },
              '&:disabled': {
                background: 'linear-gradient(90deg, #90a4ae 0%, #b0bec5 100%)',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={22} color="inherit" />
                <span>Accediendo...</span>
              </Box>
            ) : (
              'Entrar'
            )}
          </Button>
        </Box>
      </form>
    </AuthLayout>
  );
};

export default Login;
