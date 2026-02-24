import React from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Card sx={{ maxWidth: 560, width: '100%', borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ textAlign: 'center', p: 6 }}>
          <Typography variant="h2" fontWeight={800} sx={{ mb: 1, letterSpacing: '-0.02em' }} color="primary.main">
            404
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Página no encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            La ruta que intentas abrir no existe o fue movida. 
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Volver al Dashboard</Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotFound;
