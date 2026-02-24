import React, { useMemo } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';


const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const warning = theme.palette.warning.main;
  const isDark = theme.palette.mode === 'dark';
  
  // Placeholder inline SVG (pequeña marca) como último fallback
  const placeholderSvg = useMemo(() => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <defs>
        <linearGradient id='g1' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${primary}'/>
          <stop offset='100%' stop-color='${secondary}'/>
        </linearGradient>
      </defs>
      <g fill='none'>
        <circle cx='34' cy='28' r='16' fill='url(#g1)' opacity='0.9'/>
        <circle cx='60' cy='54' r='24' fill='url(#g1)' opacity='0.8'/>
        <path d='M20,64 C20,48 34,46 44,52 C52,56 54,68 50,76 C44,84 20,80 20,64 Z' fill='${warning}' opacity='0.7'/>
      </g>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [primary, secondary, warning]);

  // Logo: usar un asset local y cacheable para aparición instantánea
  // Puedes reemplazar /logo.png en public/ por tu marca; evitamos cadenas de fallback lentas
  const logoSrc = '/logo.png';
  // SVG noise (fractalNoise) como data-uri
  const noiseSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
        <feColorMatrix type='saturate' values='0'/>
        <feComponentTransfer>
          <feFuncA type='table' tableValues='0 0.35'/>
        </feComponentTransfer>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`
  );

  return (
  <Box
    sx={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark
        ? 'radial-gradient(1200px 600px at 0% 0%, #0b1020 0%, #141a2f 35%, #0d1326 75%)'
        : 'radial-gradient(1200px 600px at 0% 0%, #eef2ff 0%, #fce7f3 35%, #ffffff 75%)',
      transition: 'background 0.5s ease',
      overflow: 'hidden',
      px: { xs: 2, sm: 3 },
      py: { xs: 3, sm: 4 },
    }}
  >
    {/* Blobs decorativos con blur (no interactúan) */}
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {/* Capa de ruido sutil para textura */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.04 : 0.06,
          backgroundImage: `url("data:image/svg+xml;utf8,${noiseSvg}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: isDark ? 'soft-light' : 'multiply',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 220, sm: 320 },
          height: { xs: 220, sm: 320 },
          borderRadius: '50%',
          top: { xs: -60, sm: -80 },
          left: { xs: -60, sm: -80 },
          background: `radial-gradient(circle at 40% 40%, ${primary}33, transparent 60%)`,
          filter: 'blur(18px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 260, sm: 380 },
          height: { xs: 260, sm: 380 },
          borderRadius: '50%',
          bottom: { xs: -70, sm: -90 },
          right: { xs: -70, sm: -90 },
          background: `radial-gradient(circle at 60% 40%, ${secondary}2b, transparent 60%)`,
          filter: 'blur(22px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 180, sm: 260 },
          height: { xs: 180, sm: 260 },
          borderRadius: '50%',
          top: '50%',
          left: '65%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at 50% 50%, ${warning}40, transparent 60%)`,
          filter: 'blur(20px)',
        }}
      />
    </Box>
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        minWidth: { xs: '100%', sm: 350 },
        maxWidth: { xs: '100%', sm: 400 },
        width: '100%',
        borderRadius: { xs: 3, sm: 4 },
        boxShadow: isDark 
          ? '0 16px 50px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 16px 50px rgba(31, 38, 135, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
        background: isDark
          ? 'rgba(20, 26, 47, 0.45)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.15)'
          : '1px solid rgba(255, 255, 255, 0.5)',
        zIndex: 1,
        animation: 'fadeIn 0.7s',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(40px)' },
          to: { opacity: 1, transform: 'none' },
        },
      }}
    >
      <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 3 }, position: 'relative' }}>
        {/* Resplandor de colores del logo proyectado en la tarjeta */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primary}40 0%, ${secondary}30 40%, ${warning}25 70%, transparent 100%)`,
            filter: 'blur(40px)',
            opacity: isDark ? 0.3 : 0.4,
            pointerEvents: 'none',
            zIndex: 0,
            animation: 'pulse 4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: isDark ? 0.3 : 0.4, transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { opacity: isDark ? 0.4 : 0.5, transform: 'translate(-50%, -50%) scale(1.05)' },
            },
          }}
        />
        {/* Logo principal con resplandor */}
        <Box
          sx={{
            position: 'relative',
            display: 'inline-block',
            mb: 1.5,
            zIndex: 2,
          }}
        >
          <img
            src={logoSrc}
            alt="Logo de la tienda"
            loading="eager"
            decoding="sync"
            width={96}
            height={96}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = placeholderSvg;
            }}
            style={{
              width: '88px',
              height: '88px',
              display: 'block',
              objectFit: 'contain',
              filter: isDark
                ? `drop-shadow(0 0 12px ${primary}60) drop-shadow(0 0 24px ${secondary}40) drop-shadow(0 2px 6px rgba(0,0,0,0.45))`
                : `drop-shadow(0 0 8px ${primary}50) drop-shadow(0 0 16px ${secondary}30) drop-shadow(0 2px 6px rgba(0,0,0,0.12))`,
              opacity: 1,
              transition: 'filter 300ms ease',
              position: 'relative',
            }}
          />
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          color="primary.main"
          sx={{
            letterSpacing: 1,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            mb: 0.5,
          }}
        >
          Acceso Administrador
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            fontSize: { xs: '0.85rem', sm: '0.875rem' },
          }}
        >
          Panel privado de tu tienda
        </Typography>
      </Box>
      {children}
    </Paper>
  </Box>
  );
  }

export default AuthLayout;
