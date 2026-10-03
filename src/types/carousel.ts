import { z } from 'zod';

export type CarouselTransition = 'fade' | 'slide' | 'kenburns';

export interface CarouselConfig {
  enabled: boolean;
  intervalMs: number; // 2000 to 15000
  transitionMs: number; // 300 to 2000
  transitionType: CarouselTransition;
  showDots: boolean;
  showArrows: boolean;
  showCaptions: boolean;
  shuffle: boolean;
  scrimOpacityLight: number; // 0 to 1
  scrimOpacityDark: number; // 0 to 1
  patternOverlayEnabled: boolean;
  patternOpacity: number; // 0 to 1
  updatedAt?: string;
  updatedBy?: string;
}

export interface CarouselSlide {
  id: string;
  imageUrlDesktop: string;
  imageUrlMobile: string;
  thumbnailUrl: string;
  storagePath?: string;
  altText: string;
  caption: string;
  linkUrl?: string;
  focalX: number; // 0 to 100
  focalY: number; // 0 to 100
  order: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  createdBy?: string;
}

export const DEFAULT_CAROUSEL_CONFIG: CarouselConfig = {
  enabled: true,
  intervalMs: 5000,
  transitionMs: 1000,
  transitionType: 'fade',
  showDots: false,
  showArrows: false,
  showCaptions: true,
  shuffle: false,
  scrimOpacityLight: 0.45,
  scrimOpacityDark: 0.65,
  patternOverlayEnabled: true,
  patternOpacity: 0.2,
};

export const DEMO_CAROUSEL_SLIDES: Omit<CarouselSlide, 'id'>[] = [
  {
    imageUrlDesktop: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80',
    altText: 'The Grand Heritage Palace resort with marble arches over lake at golden hour',
    caption: 'Udaipur, Rajasthan',
    linkUrl: '/hotels',
    focalX: 50,
    focalY: 45,
    order: 1,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    imageUrlDesktop: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80',
    altText: 'Luxury cliffside ocean villa with private infinity pool overlooking the sea',
    caption: 'North Goa Beaches',
    linkUrl: '/hotels',
    focalX: 50,
    focalY: 50,
    order: 2,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    imageUrlDesktop: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80',
    altText: 'Cedar chalets nestled in alpine pine valleys beneath snowy Himalayan peaks',
    caption: 'Manali, Himachal Pradesh',
    linkUrl: '/packages',
    focalX: 45,
    focalY: 60,
    order: 3,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    imageUrlDesktop: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=300&q=80',
    altText: 'Traditional wooden luxury houseboat cruising tranquil Kerala backwater canals',
    caption: 'Alleppey, Kerala',
    linkUrl: '/packages',
    focalX: 50,
    focalY: 50,
    order: 4,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    imageUrlDesktop: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80',
    imageUrlMobile: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=300&q=80',
    altText: 'Golden sand dunes and luxury desert camp under evening twilight and stars',
    caption: 'Thar Desert, Jaisalmer',
    linkUrl: '/packages',
    focalX: 50,
    focalY: 55,
    order: 5,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

// Zod Validation Schemas
export const slideFormSchema = z.object({
  altText: z
    .string()
    .min(5, 'Alt text must be at least 5 characters for SEO & accessibility')
    .max(200, 'Alt text cannot exceed 200 characters'),
  caption: z
    .string()
    .max(120, 'Caption cannot exceed 120 characters')
    .optional()
    .default(''),
  linkUrl: z
    .string()
    .refine(
      (val) => !val || val.startsWith('/') || val.startsWith('https://'),
      'Link must be an internal path (starting with /) or a secure https:// URL'
    )
    .optional()
    .default(''),
  active: z.boolean().default(true),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export type SlideFormData = z.infer<typeof slideFormSchema>;

export const configFormSchema = z.object({
  enabled: z.boolean(),
  intervalMs: z.number().min(2000).max(15000),
  transitionMs: z.number().min(300).max(2000),
  transitionType: z.enum(['fade', 'slide', 'kenburns']),
  showDots: z.boolean(),
  showArrows: z.boolean(),
  showCaptions: z.boolean(),
  shuffle: z.boolean(),
  scrimOpacityLight: z.number().min(0).max(1),
  scrimOpacityDark: z.number().min(0).max(1),
  patternOverlayEnabled: z.boolean(),
  patternOpacity: z.number().min(0).max(1),
});
