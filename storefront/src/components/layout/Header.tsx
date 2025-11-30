'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCustomer } from '@/context/CustomerContext';
import {
  ShoppingBagIcon,
  UserIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { Category, Product } from '@/types';
import Image from 'next/image';

interface HeaderProps {
  storeName?: string;
  logoUrl?: string;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  aboutContent?: string;
  contactContent?: string;
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
}

import { 
  FaFacebook, 
  FaInstagram, 
  FaXTwitter, 
  FaWhatsapp, 
  FaTiktok, 
  FaYoutube, 
  FaLinkedin 
} from 'react-icons/fa6';

const Header: React.FC<HeaderProps> = ({ storeName = 'Mi Tienda', logoUrl, isCartOpen, setIsCartOpen, aboutContent, contactContent, socialLinks }) => {
  const { getTotalItems } = useCart();
  const { customer, logout } = useCustomer();
  const router = useRouter();
  const totalItems = getTotalItems();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  // isCartOpen y setIsCartOpen vienen ahora como props desde Layout
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMobileCategoryMenuOpen, setIsMobileCategoryMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Search autocomplete states
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [mobileSuggestions, setMobileSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const isNonEmptyHtml = (html?: string) => {
    if (!html) return false;
    const text = html
      .replace(/<[^>]*>/g, '') // remove tags
      .replace(/&nbsp;/g, ' ') // replace nbsp
      .trim();
    return text.length > 0;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await categoryService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      router.push(`/search?q=${encodeURIComponent(term.trim())}`);
      setShowSuggestions(false);
      setShowMobileSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, term: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const suggestions = term === searchTerm ? searchSuggestions : mobileSuggestions;
        if (suggestions[selectedSuggestionIndex]) {
          router.push(`/products/${suggestions[selectedSuggestionIndex].id}`);
          setShowSuggestions(false);
          setShowMobileSuggestions(false);
        }
      } else {
        handleSearch(term);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const suggestions = term === searchTerm ? searchSuggestions : mobileSuggestions;
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowMobileSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Search autocomplete function
  const searchAutocomplete = async (query: string, isMobile: boolean = false) => {
    if (!query.trim()) {
      if (isMobile) {
        setMobileSuggestions([]);
        setShowMobileSuggestions(false);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    try {
      const results = await productService.searchProductsAutocomplete(query, 5);
      if (isMobile) {
        setMobileSuggestions(results);
        setShowMobileSuggestions(results.length > 0);
      } else {
        setSearchSuggestions(results);
        setShowSuggestions(results.length > 0);
      }
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAutocomplete(searchTerm, false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAutocomplete(mobileSearchTerm, true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [mobileSearchTerm]);

  // Suggestions dropdown component
  const SuggestionsDropdown = ({ 
    suggestions, 
    show, 
    selectedIndex, 
    onSelect 
  }: {
    suggestions: Product[];
    show: boolean;
    selectedIndex: number;
    onSelect: (product: Product) => void;
  }) => {
    if (!show || suggestions.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
        {suggestions.map((product, index) => (
          <div
            key={product.id}
            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-200 ${
              index === selectedIndex 
                ? 'bg-blue-50 border-l-4 border-blue-500' 
                : 'hover:bg-gray-50'
            } ${index === suggestions.length - 1 ? '' : 'border-b border-gray-100'}`}
            onClick={() => onSelect(product)}
          >
            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
              {product.image || (product.images && product.images[0]) ? (
                <Image
                  src={product.image || (product.images && product.images[0]) || '/placeholder-product.svg'}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {product.name}
              </p>
              <p className="text-sm text-gray-600">
                ${product.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSuggestionSelect = (product: Product) => {
    router.push(`/products/${product.id}`);
    setShowSuggestions(false);
    setShowMobileSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowMobileSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD') // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-'); // replace multiple - with single -
};

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
          {/* Logo/Brand */}
          <div className="flex items-center min-w-0 absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0">
            <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-70 duration-300">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={120}
                  height={48}
                  className="h-10 md:h-12 w-auto object-contain"
                  priority
                  unoptimized
                />
              ) : (
                <span className="text-xl md:text-2xl font-light text-gray-900 tracking-tight">{storeName}</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link href="/" className="px-4 py-2 text-sm font-light text-gray-700 hover:text-gray-900 transition-colors relative group">
              Inicio
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/products" className="px-4 py-2 text-sm font-light text-gray-700 hover:text-gray-900 transition-colors relative group">
              Productos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <div className="relative group">
              <button
                onMouseEnter={() => setIsCategoryMenuOpen(true)}
                onMouseLeave={() => setIsCategoryMenuOpen(false)}
                className="px-4 py-2 text-sm font-light text-gray-700 hover:text-gray-900 transition-colors focus:outline-none flex items-center relative"
              >
                Categorías
                <ChevronDownIcon className="h-3.5 w-3.5 ml-1.5 transition-transform duration-200 group-hover:rotate-180" />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </button>
              {isCategoryMenuOpen && (
                <div
                  onMouseEnter={() => setIsCategoryMenuOpen(true)}
                  onMouseLeave={() => setIsCategoryMenuOpen(false)}
                  className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-20 py-2 animate-fade-in"
                >
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      className="block px-5 py-2.5 text-sm font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsCategoryMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {isNonEmptyHtml(aboutContent) && (
              <Link href="/about" className="px-4 py-2 text-sm font-light text-gray-700 hover:text-gray-900 transition-colors relative group">
                Nosotros
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
            {isNonEmptyHtml(contactContent) && (
              <Link href="/contact" className="px-4 py-2 text-sm font-light text-gray-700 hover:text-gray-900 transition-colors relative group">
                Contacto
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div ref={searchRef} className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, searchTerm)}
                placeholder="Buscar..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400 bg-white transition-colors font-light"
              />
              <SuggestionsDropdown
                suggestions={searchSuggestions}
                show={showSuggestions}
                selectedIndex={selectedSuggestionIndex}
                onSelect={handleSuggestionSelect}
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Social icons (desktop) */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="hidden lg:flex items-center gap-4 pr-6 border-r border-gray-200">
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaFacebook className="h-4 w-4" />
                    <span className="sr-only">Facebook</span>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaInstagram className="h-4 w-4" />
                    <span className="sr-only">Instagram</span>
                  </a>
                )}
                {(socialLinks.x || socialLinks.twitter) && (
                  <a href={socialLinks.x || socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X (Twitter)" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaXTwitter className="h-4 w-4" />
                    <span className="sr-only">X (Twitter)</span>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaTiktok className="h-4 w-4" />
                    <span className="sr-only">TikTok</span>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaYoutube className="h-4 w-4" />
                    <span className="sr-only">YouTube</span>
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaLinkedin className="h-4 w-4" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a href={(socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp" className="text-gray-400 hover:text-gray-900 transition-all duration-300 hover:scale-110">
                    <FaWhatsapp className="h-4 w-4" />
                    <span className="sr-only">WhatsApp</span>
                  </a>
                )}
              </div>
            )}
            {/* User Menu (Hidden on mobile) */}
            <div className="relative hidden md:block">
              {customer ? (
                <>
                  <button
                    className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none transition-colors group"
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    aria-haspopup="true"
                    aria-expanded={isUserMenuOpen}
                  >
                    <UserIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="ml-2 hidden sm:block text-sm font-light">{customer.name || 'Perfil'}</span>
                    <ChevronDownIcon className="ml-1 h-3.5 w-3.5 transition-transform duration-200" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-20 py-2 animate-fade-in">
                      <Link
                        href="/account"
                        className="block px-5 py-2.5 text-sm font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mi Cuenta
                      </Link>
                      <Link
                        href="/my-orders"
                        className="block px-5 py-2.5 text-sm font-light text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mis Pedidos
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="block w-full text-left px-5 py-2.5 text-sm font-light text-gray-500 hover:text-red-600 hover:bg-gray-50 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <UserIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  <span className="ml-2 hidden sm:block text-sm font-light">Cuenta</span>
                </Link>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden relative flex items-center text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <MagnifyingGlassIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </button>

            {/* Shopping Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6 transition-transform duration-300 group-hover:scale-110" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-light">
                  {totalItems}
                </span>
              )}
              <span className="ml-2 hidden md:block text-sm font-light">Carrito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Side Drawer */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-90 bg-opacity-5 w-full h-full"></div>
        
        {/* Side Menu */}
        <div 
          className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-10 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={96} height={32} className="h-8 w-auto object-contain" unoptimized />
              ) : (
                <span className="text-lg font-light text-gray-900">{storeName}</span>
              )}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="overflow-y-auto h-[calc(100vh-73px)] bg-white">
            <nav className="px-4 py-6 space-y-1 bg-white">
              {/* Home */}
              <Link 
                href="/" 
                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-light">Inicio</span>
              </Link>

              {/* Products */}
              <Link 
                href="/products" 
                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="font-light">Productos</span>
              </Link>

              {/* Categories */}
              <div className="bg-white">
                <button
                  onClick={() => setIsMobileCategoryMenuOpen(!isMobileCategoryMenuOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="font-light">Categorías</span>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isMobileCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileCategoryMenuOpen && (
                  <div className="ml-14 mt-1 space-y-1 bg-white">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/products?category=${encodeURIComponent(category.name)}`}
                        className="block px-4 py-2 text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* About */}
              {isNonEmptyHtml(aboutContent) && (
                <Link 
                  href="/about" 
                  className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-light">Nosotros</span>
                </Link>
              )}

              {/* Contact */}
              {isNonEmptyHtml(contactContent) && (
                <Link 
                  href="/contact" 
                  className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-light">Contacto</span>
                </Link>
              )}
            </nav>

            {/* Divider */}
            <div className="border-t border-gray-100 my-4 bg-white"></div>

            {/* User Section */}
            <div className="px-4 py-2 bg-white">
              {customer ? (
                <div className="space-y-1">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href="/account" 
                    className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-light">Mi Cuenta</span>
                  </Link>
                  <Link 
                    href="/my-orders" 
                    className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-light">Mis Pedidos</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-4 w-full px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-light">Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-light">Iniciar Sesión</span>
                </Link>
              )}
            </div>

            {/* Social Links */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="px-4 py-6 border-t border-gray-100 bg-white">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-4">Síguenos</p>
                <div className="flex items-center gap-3 px-4">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaFacebook className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaInstagram className="h-5 w-5" />
                    </a>
                  )}
                  {(socialLinks.x || socialLinks.twitter) && (
                    <a href={socialLinks.x || socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaXTwitter className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaTiktok className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaYoutube className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaLinkedin className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a href={(socialLinks.whatsapp.startsWith('http') ? socialLinks.whatsapp : `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}`)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                      <FaWhatsapp className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-4 bg-gray-50/80 backdrop-blur-sm border-t border-gray-100/50 animate-fade-in">
          <div ref={mobileSearchRef} className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 transition-colors" />
            </div>
            <input
              type="text"
              value={mobileSearchTerm}
              onChange={(e) => setMobileSearchTerm(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, mobileSearchTerm)}
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-12 py-3 border-0 rounded-full bg-white/90 backdrop-blur-sm shadow-sm focus:ring-2 focus:ring-gray-900/10 focus:bg-white text-gray-900 placeholder-gray-400 font-light transition-all duration-200 text-sm"
              autoFocus
            />
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SuggestionsDropdown
              suggestions={mobileSuggestions}
              show={showMobileSuggestions}
              selectedIndex={selectedSuggestionIndex}
              onSelect={handleSuggestionSelect}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;