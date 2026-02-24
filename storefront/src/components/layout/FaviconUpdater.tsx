import React, { useEffect, useState } from 'react';
import { publicApi } from '@/services/api';

export default function FaviconUpdater() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const response = await publicApi.get(`/public/store/favicon`);
        if (response.data && response.data.url) {
          setFaviconUrl(response.data.url);
        }
      } catch (error) {
        console.error('Error loading favicon:', error);
      }
    };

    fetchFavicon();
  }, []);

  useEffect(() => {
    if (!faviconUrl || typeof window === 'undefined') return;
    
    // Actualizar o crear el link de favicon de forma segura
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/x-icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
    
    // Actualizar o crear shortcut icon
    let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.type = 'image/x-icon';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = faviconUrl;
  }, [faviconUrl]);

  return null;
}
