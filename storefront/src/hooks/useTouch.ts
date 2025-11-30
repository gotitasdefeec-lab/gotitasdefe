'use client';

import { useRef, useState, useEffect } from 'react';

interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
  velocity: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

interface SwipeConfig {
  delta: number;
  preventScrollOnSwipe: boolean;
  trackTouch: boolean;
  trackMouse: boolean;
  rotationAngle: number;
}

const defaultConfig: SwipeConfig = {
  delta: 10,
  preventScrollOnSwipe: false,
  trackTouch: true,
  trackMouse: true,
  rotationAngle: 0,
};

export const useSwipeable = (
  handlers: SwipeHandlers,
  config: Partial<SwipeConfig> = {}
) => {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe } = handlers;
  const configuration = { ...defaultConfig, ...config };
  
  const elementRef = useRef<HTMLElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const initialTouch = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouch = useRef<{ x: number; y: number; time: number } | null>(null);

  const getEventData = (event: TouchEvent | MouseEvent) => {
    if ('touches' in event) {
      return {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
    return {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleStart = (event: TouchEvent | MouseEvent) => {
    const { x, y } = getEventData(event);
    const time = Date.now();
    
    initialTouch.current = { x, y, time };
    lastTouch.current = { x, y, time };
    setIsSwiping(false);
  };

  const handleMove = (event: TouchEvent | MouseEvent) => {
    if (!initialTouch.current) return;

    const { x, y } = getEventData(event);
    const time = Date.now();
    
    lastTouch.current = { x, y, time };

    const deltaX = x - initialTouch.current.x;
    const deltaY = y - initialTouch.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > configuration.delta || absDeltaY > configuration.delta) {
      setIsSwiping(true);
      
      if (configuration.preventScrollOnSwipe && 'touches' in event) {
        event.preventDefault();
      }
    }
  };

  const handleEnd = () => {
    if (!initialTouch.current || !lastTouch.current) return;

    const deltaX = lastTouch.current.x - initialTouch.current.x;
    const deltaY = lastTouch.current.y - initialTouch.current.y;
    const deltaTime = lastTouch.current.time - initialTouch.current.time;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    if (absDeltaX < configuration.delta && absDeltaY < configuration.delta) {
      initialTouch.current = null;
      lastTouch.current = null;
      setIsSwiping(false);
      return;
    }

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;

    // Determine direction based on the largest delta
    if (absDeltaX > absDeltaY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const swipeData: SwipeDirection = {
      direction,
      deltaX,
      deltaY,
      velocity,
    };

    // Call appropriate handlers
    if (onSwipe) {
      onSwipe(swipeData);
    }

    switch (direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }

    initialTouch.current = null;
    lastTouch.current = null;
    setIsSwiping(false);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    if (configuration.trackTouch) {
      element.addEventListener('touchstart', handleStart, { passive: false });
      element.addEventListener('touchmove', handleMove, { passive: false });
      element.addEventListener('touchend', handleEnd);
    }

    // Mouse events (for testing on desktop)
    if (configuration.trackMouse) {
      element.addEventListener('mousedown', handleStart);
      element.addEventListener('mousemove', handleMove);
      element.addEventListener('mouseup', handleEnd);
      element.addEventListener('mouseleave', handleEnd);
    }

    return () => {
      if (configuration.trackTouch) {
        element.removeEventListener('touchstart', handleStart);
        element.removeEventListener('touchmove', handleMove);
        element.removeEventListener('touchend', handleEnd);
      }

      if (configuration.trackMouse) {
        element.removeEventListener('mousedown', handleStart);
        element.removeEventListener('mousemove', handleMove);
        element.removeEventListener('mouseup', handleEnd);
        element.removeEventListener('mouseleave', handleEnd);
      }
    };
  }, []);

  return {
    ref: elementRef,
    isSwiping,
  };
};

// Hook for tap gestures
export const useTap = (
  onTap: () => void,
  onDoubleTap?: () => void,
  config: { delay?: number; threshold?: number } = {}
) => {
  const { delay = 300, threshold = 10 } = config;
  const elementRef = useRef<HTMLElement>(null);
  
  const tapStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    tapStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!tapStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - tapStart.current.x);
    const deltaY = Math.abs(touch.clientY - tapStart.current.y);
    const deltaTime = Date.now() - tapStart.current.time;

    // Check if it's a valid tap (small movement, quick time)
    if (deltaX < threshold && deltaY < threshold && deltaTime < 300) {
      tapCount.current++;

      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }

      if (tapCount.current === 1) {
        tapTimer.current = setTimeout(() => {
          onTap();
          tapCount.current = 0;
        }, delay);
      } else if (tapCount.current === 2 && onDoubleTap) {
        onDoubleTap();
        tapCount.current = 0;
      }
    }

    tapStart.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (tapTimer.current) {
        clearTimeout(tapTimer.current);
      }
    };
  }, [onTap, onDoubleTap, delay, threshold]);

  return { ref: elementRef };
};

// Hook for long press
export const useLongPress = (
  onLongPress: () => void,
  config: { delay?: number; threshold?: number } = {}
) => {
  const { delay = 500, threshold = 10 } = config;
  const elementRef = useRef<HTMLElement>(null);
  
  const pressStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleStart = (event: TouchEvent | MouseEvent) => {
    const { x, y } = 'touches' in event ? 
      { x: event.touches[0].clientX, y: event.touches[0].clientY } :
      { x: event.clientX, y: event.clientY };

    pressStart.current = { x, y, time: Date.now() };

    pressTimer.current = setTimeout(() => {
      if (pressStart.current) {
        onLongPress();
      }
    }, delay);
  };

  const handleMove = (event: TouchEvent | MouseEvent) => {
    if (!pressStart.current) return;

    const { x, y } = 'touches' in event ? 
      { x: event.touches[0].clientX, y: event.touches[0].clientY } :
      { x: event.clientX, y: event.clientY };

    const deltaX = Math.abs(x - pressStart.current.x);
    const deltaY = Math.abs(y - pressStart.current.y);

    if (deltaX > threshold || deltaY > threshold) {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
      pressStart.current = null;
    }
  };

  const handleEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    pressStart.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleStart);
    element.addEventListener('touchmove', handleMove);
    element.addEventListener('touchend', handleEnd);
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mousemove', handleMove);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mouseleave', handleEnd);

    return () => {
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mousemove', handleMove);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('mouseleave', handleEnd);
      
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, [onLongPress, delay, threshold]);

  return { ref: elementRef };
};