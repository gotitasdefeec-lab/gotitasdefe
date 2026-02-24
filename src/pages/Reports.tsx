import React from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Reports = () => {
  const salesData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const productData = {
    labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D', 'Producto E'],
    datasets: [
      {
        label: 'Productos Más Vendidos',
        data: [150, 120, 100, 80, 50],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Reportes
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ventas Mensuales
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Productos Más Vendidos
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={productData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumen de Métricas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ventas Totales</Typography>
                <Typography variant="h4">$123,456</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Pedidos</Typography>
                <Typography variant="h4">1,234</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Clientes Nuevos</Typography>
                <Typography variant="h4">256</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Tasa de Conversión</Typography>
                <Typography variant="h4">3.2%</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default Reports;