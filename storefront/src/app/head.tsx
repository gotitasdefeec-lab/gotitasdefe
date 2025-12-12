import React from 'react';

export default function Head() {
  const apiBase = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'https://api.gotasdefe.com/api';
  let apiOrigin = '';
  try {
    apiOrigin = new URL(apiBase).origin;
  } catch { }
  return (
    <>
      {apiOrigin && (
        <>
          <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={apiOrigin} />
        </>
      )}
      <title>Mi Tienda Online | Productos, Ofertas y Más</title>
      <meta name="description" content="Compra en la mejor tienda online. Encuentra productos, ofertas y novedades con envío rápido y seguro." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Mi Tienda Online" />
      <meta property="og:description" content="Compra en la mejor tienda online. Encuentra productos, ofertas y novedades con envío rápido y seguro." />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:image" content="/logo.png" />
      <meta property="og:url" content="https://mitienda.com" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Mi Tienda Online" />
      <meta name="twitter:description" content="Compra en la mejor tienda online. Encuentra productos, ofertas y novedades con envío rápido y seguro." />
      <meta name="twitter:image" content="/logo.png" />
      <link rel="canonical" href="https://mitienda.com" />
    </>
  );
}
