'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { carouselService, CarouselImage } from '@/services/carouselService';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function HeroCarousel({ initialSlides }: { initialSlides?: CarouselImage[] }) {
  const [slides, setSlides] = useState<any[]>(initialSlides ?? []);
  const [loading, setLoading] = useState(!initialSlides || initialSlides.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (initialSlides && initialSlides.length > 0) {
      console.log('HeroCarousel: Using initial slides from server:', initialSlides.length);
      return; // ya viene del servidor
    }
    const loadCarousel = async () => {
      try {
        console.log('HeroCarousel: Fetching carousel data from API...');
        const carouselData = await carouselService.getCarousel();
        console.log('HeroCarousel: Received carousel data:', carouselData);
        const transformedSlides = carouselData.map(slide => ({
          id: slide.id,
          imageUrl: slide.imageUrl || '/carousel-placeholder.svg',
          title: slide.title || '',
          description: slide.description || ''
        }));
        console.log('HeroCarousel: Transformed slides:', transformedSlides.length);
        setSlides(transformedSlides);
      } catch (error) {
        console.error('Error loading carousel:', error);
        // Fallback slides
        setSlides([
          { id: 1, imageUrl: '/carousel-placeholder.svg', title: '', description: '' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadCarousel();
  }, [initialSlides]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
      handleUserInteraction();
    } else if (isRightSwipe) {
      prevSlide();
      handleUserInteraction();
    }
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  // Pause auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10 seconds
  };

  if (loading) {
    return (
      <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden bg-white shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Container - Responsive Heights */}
      <div 
        className="relative h-64 md:h-80 lg:h-96 overflow-hidden bg-gray-50"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Slides */}
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="w-full flex-shrink-0 relative bg-gray-100">
              {slide.imageUrl.startsWith('data:') ? (
                // Usar img nativo para imágenes base64
                <img
                  src={slide.imageUrl}
                  alt={slide.title || 'Imagen del carrusel'}
                  className="w-full h-full object-contain bg-white"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                // Usar Image de Next.js para URLs remotas
                <Image
                  src={slide.imageUrl}
                  alt={slide.title || 'Imagen del carrusel'}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  quality={80}
                  className="object-contain bg-white"
                />
              )}
              
              {/* Content Overlay - Only if there's actual content */}
              {(slide.title?.trim() || slide.description?.trim()) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end pointer-events-none">
                  <div className="w-full p-4 md:p-6 lg:p-8 text-white">
                    <div className="max-w-4xl">
                      {slide.title?.trim() && (
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                          {slide.title.trim()}
                        </h2>
                      )}
                      {slide.description?.trim() && (
                        <p className="text-sm md:text-base lg:text-lg opacity-90 max-w-2xl drop-shadow">
                          {slide.description.trim()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Arrows - More prominent on desktop */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => { prevSlide(); handleUserInteraction(); }}
              className="absolute left-2 md:left-4 lg:left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 md:p-3 lg:p-4 transition-all duration-200 backdrop-blur-sm group"
              aria-label="Slide anterior"
            >
              <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-white group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={() => { nextSlide(); handleUserInteraction(); }}
              className="absolute right-2 md:right-4 lg:right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 md:p-3 lg:p-4 transition-all duration-200 backdrop-blur-sm group"
              aria-label="Slide siguiente"
            >
              <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation - Better spacing on desktop */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => { goToSlide(index); handleUserInteraction(); }}
              className={`w-2 h-2 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
