'use client';

import React, { useEffect, useState } from 'react';
import { getPolicies, StorePolicy } from '@/services/policyService';
import Link from 'next/link';
import { 
  FaFacebook, 
  FaInstagram, 
  FaXTwitter, 
  FaWhatsapp, 
  FaTiktok, 
  FaYoutube, 
  FaLinkedin 
} from 'react-icons/fa6';

interface FooterProps {
  storeInfo?: {
    name: string;
    description: string;
    email: string;
    phone: string;
    address: string;
    about?: string;
    contact?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string; // legacy
    x?: string; // X (Twitter)
    whatsapp?: string;
    tiktok?: string;
    youtube?: string;
    linkedin?: string;
  };
  policies?: StorePolicy[]; // opcional: prehidratado desde el servidor
}

const Footer: React.FC<FooterProps> = ({ storeInfo, socialLinks, policies: initialPolicies }) => {
  const currentYear = new Date().getFullYear();
  const [policies, setPolicies] = useState<StorePolicy[]>(initialPolicies ?? []);

  useEffect(() => {
    if (initialPolicies && initialPolicies.length > 0) return; // ya viene hidratado
    getPolicies().then(setPolicies).catch(() => setPolicies([]));
  }, [initialPolicies]);

  const isNonEmptyHtml = (html?: string) => {
    if (!html) return false;
    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return text.length > 0;
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Store Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-light text-white mb-6 tracking-tight">{storeInfo?.name || 'Mi Tienda'}</h3>
            <p className="text-gray-300 mb-8 leading-relaxed font-light max-w-md">
              {storeInfo?.description || 'La mejor tienda online para todas tus necesidades.'}
            </p>
            <div className="space-y-4 text-sm">
              {storeInfo?.email && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-300 font-light">{storeInfo.email}</span>
                </div>
              )}
              {storeInfo?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span className="text-gray-300 font-light">{storeInfo.phone}</span>
                </div>
              )}
              {storeInfo?.address && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-300 font-light leading-relaxed">{storeInfo.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-light text-white mb-6 tracking-tight">Navegación</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors font-light relative group">
                  Inicio
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-blue-400 transition-colors font-light relative group">
                  Productos
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              {isNonEmptyHtml(storeInfo?.about) && (
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-blue-400 transition-colors font-light relative group">
                    Nosotros
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              )}
              {isNonEmptyHtml(storeInfo?.contact) && (
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors font-light relative group">
                    Contacto
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Service - Dynamic Policies */}
          <div>
            <h4 className="text-lg font-light text-white mb-6 tracking-tight">Ayuda</h4>
            <ul className="space-y-3">
              {policies.length === 0 ? (
                <li className="text-gray-400 font-light">No hay políticas disponibles.</li>
              ) : (
                policies.map((policy) => (
                  <li key={policy.id}>
                    <Link
                      href={`/policies#policy-${policy.id}`}
                      className="text-gray-300 hover:text-blue-400 transition-colors font-light relative group"
                    >
                      {policy.title}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-700">
            <div className="text-center mb-8">
              <h4 className="text-lg font-light text-white mb-2 tracking-tight">Síguenos</h4>
              <p className="text-gray-300 font-light">Mantente conectado con nosotros</p>
            </div>
            <div className="flex justify-center gap-4">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-110"
                  title="Facebook"
                >
                  <FaFacebook className="h-5 w-5" />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:border-transparent transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-110"
                  title="Instagram"
                >
                  <FaInstagram className="h-5 w-5" />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {(socialLinks.x || socialLinks.twitter) && (
                <a
                  href={socialLinks.x || socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-black hover:border-black transition-all duration-300 shadow-lg hover:shadow-gray-500/25 hover:scale-110"
                  title="X (Twitter)"
                >
                  <FaXTwitter className="h-5 w-5" />
                  <span className="sr-only">X (Twitter)</span>
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-black hover:border-black transition-all duration-300 shadow-lg hover:shadow-gray-500/25 hover:scale-110"
                  title="TikTok"
                >
                  <FaTiktok className="h-5 w-5" />
                  <span className="sr-only">TikTok</span>
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-110"
                  title="YouTube"
                >
                  <FaYoutube className="h-5 w-5" />
                  <span className="sr-only">YouTube</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-110"
                  title="LinkedIn"
                >
                  <FaLinkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={(socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-500 hover:border-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-110"
                  title="WhatsApp"
                >
                  <FaWhatsapp className="h-5 w-5" />
                  <span className="sr-only">WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Policies Link */}
        {policies.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-700 text-center">
            <Link
              href="/policies"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-blue-400 font-light transition-colors relative group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Políticas de la tienda
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-400">
            <p className="font-light">
              © {currentYear} <span className="font-medium text-white">{storeInfo?.name || 'Mi Tienda'}</span>
            </p>
            <div className="hidden md:block w-1 h-1 bg-gray-600 rounded-full"></div>
            <p className="font-light">Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;