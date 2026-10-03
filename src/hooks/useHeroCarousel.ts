import { useEffect, useRef, useState, useMemo } from 'react';
import {
  CarouselConfig,
  CarouselSlide,
  DEFAULT_CAROUSEL_CONFIG,
  DEMO_CAROUSEL_SLIDES,
} from '../types/carousel';
import {
  subscribeActiveSlides,
  subscribeCarouselConfig,
} from '../services/carouselService';

export function useHeroCarousel(customConfig?: Partial<CarouselConfig>, previewSlides?: CarouselSlide[]) {
  const [config, setConfig] = useState<CarouselConfig>(() => ({
    ...DEFAULT_CAROUSEL_CONFIG,
    ...customConfig,
  }));

  const [slides, setSlides] = useState<CarouselSlide[]>(() => {
    if (previewSlides && previewSlides.length > 0) return previewSlides;
    return DEMO_CAROUSEL_SLIDES.map((s, idx) => ({ id: `demo-${idx + 1}`, ...s }));
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync customConfig if passed (e.g. in Live Preview)
  useEffect(() => {
    if (customConfig) {
      setConfig((prev) => ({ ...prev, ...customConfig }));
    }
  }, [customConfig]);

  // Sync previewSlides if passed
  useEffect(() => {
    if (previewSlides && previewSlides.length > 0) {
      setSlides(previewSlides);
      setCurrentIndex(0);
      setLoading(false);
    }
  }, [previewSlides]);

  // Subscribe to real-time config if not in custom preview mode
  useEffect(() => {
    if (previewSlides) return;

    const unsubConfig = subscribeCarouselConfig((newConfig) => {
      setConfig((prev) => ({ ...prev, ...newConfig, ...customConfig }));
    });

    const unsubSlides = subscribeActiveSlides((newSlides) => {
      if (newSlides.length > 0) {
        setSlides(newSlides);
      }
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubSlides();
    };
  }, [previewSlides, customConfig]);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Page Visibility API: pause when tab is hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Preload next slide image so transitions are instant and never flash
  useEffect(() => {
    if (slides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % slides.length;
    const nextSlide = slides[nextIdx];
    if (nextSlide?.imageUrlDesktop) {
      const img = new Image();
      img.src = nextSlide.imageUrlDesktop;
    }
  }, [currentIndex, slides]);

  // Auto-advance interval timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!config.enabled || slides.length <= 1 || isPaused || prefersReducedMotion) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = Math.max(2000, config.intervalMs || 5000);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.enabled, config.intervalMs, slides.length, isPaused, prefersReducedMotion]);

  // Navigation handlers
  const nextSlide = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const currentSlide = slides[currentIndex] || slides[0] || null;

  return {
    config,
    slides,
    currentSlide,
    currentIndex,
    loading,
    isPaused,
    prefersReducedMotion,
    nextSlide,
    prevSlide,
    goToSlide,
    togglePause,
    setIsPaused,
  };
}
