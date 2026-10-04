import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Pause, Play } from 'lucide-react';
import { useHeroCarousel } from '../../hooks/useHeroCarousel';
import { useTheme } from '../../context/ThemeContext';
import { CarouselConfig, CarouselSlide } from '../../types/carousel';

interface HeroCarouselProps {
  customConfig?: Partial<CarouselConfig>;
  previewSlides?: CarouselSlide[];
  isMobilePreview?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  customConfig,
  previewSlides,
  isMobilePreview = false,
}) => {
  const { resolvedTheme } = useTheme();
  const {
    config,
    slides,
    currentIndex,
    currentSlide,
    isPaused,
    prefersReducedMotion,
    nextSlide,
    prevSlide,
    goToSlide,
    togglePause,
  } = useHeroCarousel(customConfig, previewSlides);

  const activeScrimOpacity =
    resolvedTheme === 'dark' ? config.scrimOpacityDark : config.scrimOpacityLight;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* ----------------------------------------------------
          LAYER 1: Full-Bleed Carousel Images
          ---------------------------------------------------- */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        const transitionDuration = `${config.transitionMs || 1000}ms`;

        // Determine transition styles based on config.transitionType
        let transitionClass = 'transition-opacity ease-in-out';
        let customStyle: React.CSSProperties = {
          transitionDuration,
          objectPosition: `${slide.focalX}% ${slide.focalY}%`,
        };

        if (config.transitionType === 'slide') {
          transitionClass = 'transition-all duration-700 ease-in-out';
        }

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ transitionDuration }}
          >
            <picture>
              {slide.imageUrlMobile && (
                <source
                  media="(max-width: 768px)"
                  srcSet={slide.imageUrlMobile}
                  type="image/webp"
                />
              )}
              <img
                src={isMobilePreview && slide.imageUrlMobile ? slide.imageUrlMobile : slide.imageUrlDesktop}
                alt={slide.altText || slide.caption || 'Travel backdrop'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`w-full h-full object-cover ${
                  config.transitionType === 'kenburns' && !prefersReducedMotion && isActive
                    ? 'scale-105 transition-transform duration-10000 ease-out'
                    : 'scale-100'
                }`}
                style={customStyle}
              />
            </picture>
          </div>
        );
      })}

      {/* Fallback branded gradient if slides are empty */}
      {slides.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 z-0" />
      )}

      {/* ----------------------------------------------------
          LAYER 2: Readability Gradient Scrim
          Darkened gradient from bottom-left up for WCAG AA text contrast
          ---------------------------------------------------- */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: activeScrimOpacity,
          background:
            resolvedTheme === 'dark'
              ? 'linear-gradient(to top right, rgba(11, 17, 32, 0.95) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(2, 132, 199, 0.35) 100%)'
              : 'linear-gradient(to top right, rgba(11, 17, 32, 0.85) 0%, rgba(15, 23, 42, 0.65) 50%, rgba(255, 255, 255, 0.15) 100%)',
        }}
      />

      {/* ----------------------------------------------------
          LAYER 3: Decorative Dotted Pattern Overlay
          Uses brand primary CSS token dynamically
          ---------------------------------------------------- */}
      <div
        className="absolute inset-0 z-30 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: config.patternOverlayEnabled ? (config.patternOpacity ?? 0.2) : 0,
          backgroundImage: 'radial-gradient(var(--brand-primary, #0284c7) 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* ----------------------------------------------------
          LAYER 4: Optional Interactive Carousel Elements (Buttons, Dots, Caption)
          pointer-events-auto enables interaction while keeping hero clicks intact
          ---------------------------------------------------- */}
      {slides.length > 0 && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 sm:p-8">
          {/* Top Row: Play / Pause Control if in preview or arrows enabled */}
          <div className="flex items-center justify-between pointer-events-auto">
            {/* Prev / Next Arrows if enabled */}
            {config.showArrows && slides.length > 1 && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous background photo"
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-xs border border-white/10 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-hidden"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next background photo"
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-xs border border-white/10 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-hidden"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Row: Caption Chip & Dot Indicators */}
          <div className="flex items-end justify-between gap-2 sm:gap-4 pointer-events-auto w-full max-w-full overflow-hidden">
            {/* Optional Caption Chip */}
            {config.showCaptions && currentSlide?.caption ? (
              currentSlide.linkUrl ? (
                <Link
                  to={currentSlide.linkUrl}
                  className="group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white text-[11px] sm:text-xs font-semibold shadow-lg transition max-w-[140px] sm:max-w-xs"
                >
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{currentSlide.caption}</span>
                  <span className="hidden sm:inline text-[10px] text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore →
                  </span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-[11px] sm:text-xs font-semibold shadow-lg max-w-[140px] sm:max-w-xs">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{currentSlide.caption}</span>
                </div>
              )
            ) : (
              <div />
            )}

            {/* Optional Small Dot Indicators */}
            {config.showDots && slides.length > 1 && (
              <div
                role="tablist"
                aria-label="Slide indicators"
                className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
              >
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`Go to slide ${idx + 1}: ${s.caption || s.altText}`}
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus:outline-hidden ${
                      idx === currentIndex ? 'w-6 bg-sky-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
