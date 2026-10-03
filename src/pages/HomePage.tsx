import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { HeroSearch } from '../components/home/HeroSearch';
import { TrendingDestinationsSection } from '../components/home/TrendingDestinationsSection';
import { FeaturedHotelsSection } from '../components/home/FeaturedHotelsSection';
import { PopularPackagesSection } from '../components/home/PopularPackagesSection';
import { OffersBannerSection } from '../components/home/OffersBannerSection';
import { WhyChooseUsSection } from '../components/home/WhyChooseUsSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { HomepageSection } from '../types';

export const HomePage: React.FC = () => {
  const { sections } = useSettings();

  const renderSection = (section: HomepageSection) => {
    if (!section.enabled) return null;

    switch (section.type) {
      case 'hero':
        return <HeroSearch key={section.id} />;
      case 'trending_destinations':
        return <TrendingDestinationsSection key={section.id} section={section} />;
      case 'offers_banner':
        return <OffersBannerSection key={section.id} section={section} />;
      case 'featured_hotels':
        return <FeaturedHotelsSection key={section.id} section={section} />;
      case 'popular_packages':
        return <PopularPackagesSection key={section.id} section={section} />;
      case 'why_choose_us':
        return <WhyChooseUsSection key={section.id} section={section} />;
      case 'testimonials':
        return <TestimonialsSection key={section.id} section={section} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      {/* Sections dynamically rendered in admin-configured order */}
      {sections.map((section) => renderSection(section))}
    </div>
  );
};
