import React, { useState } from 'react';
import { Button, TextField, Alert, Typography, Paper } from '@mui/material';
import AuthLayout from '../components/layout/AuthLayout';
import { getCurrentUser, changeAdminPassword } from '../services/authService';

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    console.log('📝 Iniciando cambio de contraseña desde frontend...');
    
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const user = getCurrentUser();
    console.log('👤 Usuario actual:', user);
    
    if (!user || !user.email) {
      setError('No se encontró el usuario administrador.');
      return;
    }
    
    try {
      console.log('🔄 Llamando a changeAdminPassword con email:', user.email);
      const message = await changeAdminPassword(user.email, oldPassword, newPassword, confirmPassword);
      console.log('✅ Respuesta del backend:', message);
      setSuccess(message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('❌ Error al cambiar contraseña:', err);
      setError(err.message);
    }
  };

  return (
    <AuthLayout>
      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Cambiar contraseña de administrador
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <TextField
            label="Contraseña actual"
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Cambiar contraseña
          </Button>
        </form>
      </Paper>
    </AuthLayout>
  );
};

export default ChangePassword;
