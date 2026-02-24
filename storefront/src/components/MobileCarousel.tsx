'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileCarouselProps {
  items: Array<{
    id: number;
    imageUrl: string;
    title: string;
    description?: string;
  }>;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  height?: string;
}

const MobileCarousel: React.FC<MobileCarouselProps> = ({
  items,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  height = 'h-48 sm:h-64 md:h-80'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch handlers for swipe
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
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, items.length]);

  // Pause auto-play on user interaction
  const handleUserInteraction = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(autoPlay), 10000); // Resume after 10 seconds
  };

  if (items.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-lg shadow-lg bg-gray-200"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Container */}
      <div 
        className={`relative ${height} overflow-hidden`}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Slides */}
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0 relative"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              
              {/* Overlay with content */}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
                <div className="w-full p-4 sm:p-6 text-white">
                  <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-sm sm:text-base opacity-90 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {showArrows && items.length > 1 && (
          <>
            <button
              onClick={() => { prevSlide(); handleUserInteraction(); }}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1.5 sm:p-2 transition-all duration-200 backdrop-blur-sm"
              aria-label="Slide anterior"
            >
              <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
            
            <button
              onClick={() => { nextSlide(); handleUserInteraction(); }}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1.5 sm:p-2 transition-all duration-200 backdrop-blur-sm"
              aria-label="Slide siguiente"
            >
              <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </button>
          </>
        )}

        {/* Loading indicator */}
        {isAutoPlaying && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
            <div className="w-8 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dots Navigation */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => { goToSlide(index); handleUserInteraction(); }}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Touch hint for first-time users */}
      {currentIndex === 0 && (
        <div className="absolute bottom-12 sm:bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xs sm:text-sm opacity-75 animate-pulse">
          👈 Desliza para ver más 👉
        </div>
      )}
    </div>
  );
};

export default MobileCarousel;