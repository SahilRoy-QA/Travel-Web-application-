import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from './firebase';
import {
  CarouselConfig,
  CarouselSlide,
  DEFAULT_CAROUSEL_CONFIG,
  DEMO_CAROUSEL_SLIDES,
} from '../types/carousel';

const CACHE_CONFIG_KEY = 'illusion_carousel_config_v1';
const CACHE_SLIDES_KEY = 'illusion_carousel_slides_v1';

// ----------------------------------------------------
// 1. Config Subscriptions & Updates
// ----------------------------------------------------

export function subscribeCarouselConfig(
  onUpdate: (config: CarouselConfig) => void
): () => void {
  // Load cached first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_CONFIG_KEY);
    if (cached) {
      try {
        onUpdate(JSON.parse(cached));
      } catch (e) {
        console.warn('Config cache parse failed:', e);
      }
    }
  }

  const configRef = doc(db, 'heroCarousel', 'config');

  const unsubscribe = onSnapshot(
    configRef,
    (snap) => {
      if (snap.exists()) {
        const data = { ...DEFAULT_CAROUSEL_CONFIG, ...snap.data() } as CarouselConfig;
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_CONFIG_KEY, JSON.stringify(data));
        }
        onUpdate(data);
      } else {
        onUpdate(DEFAULT_CAROUSEL_CONFIG);
      }
    },
    (err) => {
      console.warn('Carousel config listener:', err.message);
      onUpdate(DEFAULT_CAROUSEL_CONFIG);
    }
  );

  return unsubscribe;
}

export async function saveCarouselConfig(
  config: CarouselConfig,
  userEmail?: string | null
): Promise<void> {
  const configRef = doc(db, 'heroCarousel', 'config');
  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail || 'admin',
  };

  try {
    await setDoc(configRef, payload, { merge: true });
    await logCarouselAudit('UPDATE_CONFIG', 'Updated carousel settings', userEmail);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'heroCarousel/config');
  }
}

// ----------------------------------------------------
// 2. Slide Subscriptions (Customer & Admin)
// ----------------------------------------------------

/**
 * Customer Subscription: fetches slides, orders by `order` ascending, caches for offline
 */
export function subscribeActiveSlides(
  onUpdate: (slides: CarouselSlide[]) => void
): () => void {
  // Load from cache first
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_SLIDES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CarouselSlide[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdate(parsed);
        }
      } catch (e) {
        console.warn('Slides cache parse failed:', e);
      }
    }
  }

  const slidesCol = collection(db, 'heroCarousel', 'slides', 'items');
  const q = query(slidesCol, orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CarouselSlide));
      const now = new Date().getTime();

      // Filter active and current schedule
      const activeSlides = all.filter((s) => {
        if (!s.active) return false;
        if (s.startDate && new Date(s.startDate).getTime() > now) return false;
        if (s.endDate && new Date(s.endDate).getTime() < now) return false;
        return true;
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_SLIDES_KEY, JSON.stringify(activeSlides));
      }
      onUpdate(activeSlides.length > 0 ? activeSlides : (all.length > 0 ? all : []));
    },
    (err) => {
      console.warn('Active slides listener fallback:', err.message);
      // If Firestore is empty or fails, use demo slides
      onUpdate(
        DEMO_CAROUSEL_SLIDES.map((s, idx) => ({
          id: `demo-${idx + 1}`,
          ...s,
        }))
      );
    }
  );

  return unsubscribe;
}

/**
 * Admin Subscription: returns all slides regardless of active/schedule status
 */
export function subscribeAllSlides(
  onUpdate: (slides: CarouselSlide[]) => void
): () => void {
  const slidesCol = collection(db, 'heroCarousel', 'slides', 'items');
  const q = query(slidesCol, orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CarouselSlide));
      onUpdate(list);
    },
    (err) => {
      console.warn('Admin slides listener notice:', err.message);
    }
  );

  return unsubscribe;
}

// ----------------------------------------------------
// 3. Slide Operations
// ----------------------------------------------------

export async function saveSlide(
  slide: Partial<CarouselSlide> & { id?: string },
  userEmail?: string | null
): Promise<string> {
  const isNew = !slide.id;
  const slideId = slide.id || `slide_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const slideRef = doc(db, 'heroCarousel', 'slides', 'items', slideId);

  const payload: CarouselSlide = {
    id: slideId,
    imageUrlDesktop: slide.imageUrlDesktop || '',
    imageUrlMobile: slide.imageUrlMobile || slide.imageUrlDesktop || '',
    thumbnailUrl: slide.thumbnailUrl || slide.imageUrlDesktop || '',
    storagePath: slide.storagePath || '',
    altText: slide.altText || 'Luxury travel destination',
    caption: slide.caption || '',
    linkUrl: slide.linkUrl || '',
    focalX: typeof slide.focalX === 'number' ? slide.focalX : 50,
    focalY: typeof slide.focalY === 'number' ? slide.focalY : 50,
    order: typeof slide.order === 'number' ? slide.order : 99,
    active: slide.active !== undefined ? slide.active : true,
    startDate: slide.startDate || null,
    endDate: slide.endDate || null,
    createdAt: slide.createdAt || new Date().toISOString(),
    createdBy: userEmail || 'admin',
  };

  try {
    await setDoc(slideRef, payload, { merge: true });
    await logCarouselAudit(
      isNew ? 'CREATE_SLIDE' : 'UPDATE_SLIDE',
      `${isNew ? 'Created' : 'Updated'} slide: ${payload.caption || payload.id}`,
      userEmail
    );
    return slideId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `heroCarousel/slides/items/${slideId}`);
    return slideId;
  }
}

export async function deleteSlide(
  slideId: string,
  storagePath?: string,
  userEmail?: string | null
): Promise<void> {
  try {
    const slideRef = doc(db, 'heroCarousel', 'slides', 'items', slideId);
    await deleteDoc(slideRef);

    // Clean up Storage files if applicable
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn('Storage file cleanup notice:', storageErr);
      }
    }

    await logCarouselAudit('DELETE_SLIDE', `Deleted slide ID: ${slideId}`, userEmail);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `heroCarousel/slides/items/${slideId}`);
  }
}

export async function reorderSlides(
  orderedSlideIds: string[],
  userEmail?: string | null
): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderedSlideIds.forEach((id, index) => {
      const slideRef = doc(db, 'heroCarousel', 'slides', 'items', id);
      batch.update(slideRef, { order: index + 1 });
    });

    await batch.commit();
    await logCarouselAudit(
      'REORDER_SLIDES',
      `Reordered ${orderedSlideIds.length} slides`,
      userEmail
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'heroCarousel/slides/items');
  }
}

export async function duplicateSlide(
  slide: CarouselSlide,
  userEmail?: string | null
): Promise<string> {
  const newId = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const duplicated: CarouselSlide = {
    ...slide,
    id: newId,
    caption: `${slide.caption || 'Slide'} (Copy)`,
    order: slide.order + 1,
    createdAt: new Date().toISOString(),
    createdBy: userEmail || 'admin',
  };

  return await saveSlide(duplicated, userEmail);
}

export async function seedDemoCarouselSlides(
  userEmail?: string | null
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Also seed default config if missing
    const configRef = doc(db, 'heroCarousel', 'config');
    batch.set(configRef, {
      ...DEFAULT_CAROUSEL_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'admin',
    }, { merge: true });

    DEMO_CAROUSEL_SLIDES.forEach((slide, idx) => {
      const id = `demo_slide_${idx + 1}`;
      const refDoc = doc(db, 'heroCarousel', 'slides', 'items', id);
      batch.set(refDoc, {
        id,
        ...slide,
        createdBy: userEmail || 'admin',
      });
    });

    await batch.commit();
    await logCarouselAudit('SEED_DEMO', 'Seeded 5 travel demo slides', userEmail);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'heroCarousel/slides/items');
  }
}

// ----------------------------------------------------
// 4. Audit Logging
// ----------------------------------------------------

export async function logCarouselAudit(
  action: string,
  details: string,
  userEmail?: string | null
): Promise<void> {
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const auditRef = doc(db, 'auditLogs', auditId);
    await setDoc(auditRef, {
      id: auditId,
      action: `CAROUSEL_${action}`,
      details,
      user: userEmail || 'admin',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Non-blocking
    console.warn('Carousel audit log notice:', e);
  }
}

// ----------------------------------------------------
// 5. Client-Side Image Resizing & WebP Compression
// ----------------------------------------------------

export interface ProcessedImages {
  desktopBlob: Blob;
  mobileBlob: Blob;
  thumbBlob: Blob;
  desktopDataUrl: string;
  mobileDataUrl: string;
  thumbDataUrl: string;
  stats: {
    originalSize: number;
    desktopSize: number;
    mobileSize: number;
    thumbSize: number;
    width: number;
    height: number;
  };
}

/**
 * Resizes an image file client-side using HTML Canvas to 1920px (Desktop),
 * 800px (Mobile), and 300px (Thumbnail), converting to optimized WebP.
 */
export async function processAndResizeImage(file: File): Promise<ProcessedImages> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = async () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        const resizeToCanvas = (maxDimension: number, quality = 0.85): Promise<{ blob: Blob; dataUrl: string }> => {
          return new Promise((res) => {
            const canvas = document.createElement('canvas');
            let targetW = origWidth;
            let targetH = origHeight;

            if (targetW > maxDimension) {
              targetH = Math.round((origHeight * maxDimension) / origWidth);
              targetW = maxDimension;
            }

            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetW, targetH);
            }

            const dataUrl = canvas.toDataURL('image/webp', quality);
            canvas.toBlob(
              (blob) => {
                res({ blob: blob || new Blob(), dataUrl });
              },
              'image/webp',
              quality
            );
          });
        };

        try {
          const [desktop, mobile, thumb] = await Promise.all([
            resizeToCanvas(1920, 0.85),
            resizeToCanvas(800, 0.82),
            resizeToCanvas(300, 0.75),
          ]);

          resolve({
            desktopBlob: desktop.blob,
            mobileBlob: mobile.blob,
            thumbBlob: thumb.blob,
            desktopDataUrl: desktop.dataUrl,
            mobileDataUrl: mobile.dataUrl,
            thumbDataUrl: thumb.dataUrl,
            stats: {
              originalSize: file.size,
              desktopSize: desktop.blob.size,
              mobileSize: mobile.blob.size,
              thumbSize: thumb.blob.size,
              width: origWidth,
              height: origHeight,
            },
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads processed desktop, mobile, and thumbnail images to Firebase Storage.
 * If Storage is not provisioned or fails, gracefully falls back to optimized data URLs.
 */
export async function uploadCarouselImages(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{
  imageUrlDesktop: string;
  imageUrlMobile: string;
  thumbnailUrl: string;
  storagePath: string;
}> {
  onProgress?.(15);
  const processed = await processAndResizeImage(file);
  onProgress?.(40);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  const basePath = `carousel/${timestamp}_${safeName}`;

  try {
    const desktopRef = ref(storage, `${basePath}_desktop.webp`);
    const mobileRef = ref(storage, `${basePath}_mobile.webp`);
    const thumbRef = ref(storage, `${basePath}_thumb.webp`);

    // Upload desktop version
    const uploadTask = uploadBytesResumable(desktopRef, processed.desktopBlob, {
      contentType: 'image/webp',
    });

    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snap) => {
          const pct = 40 + Math.round((snap.bytesTransferred / snap.totalBytes) * 40);
          onProgress?.(pct);
        },
        (error) => reject(error),
        () => resolve()
      );
    });

    // Upload mobile and thumb
    await Promise.all([
      uploadBytesResumable(mobileRef, processed.mobileBlob, { contentType: 'image/webp' }),
      uploadBytesResumable(thumbRef, processed.thumbBlob, { contentType: 'image/webp' }),
    ]);

    onProgress?.(90);

    const [desktopUrl, mobileUrl, thumbUrl] = await Promise.all([
      getDownloadURL(desktopRef),
      getDownloadURL(mobileRef),
      getDownloadURL(thumbRef),
    ]);

    onProgress?.(100);

    return {
      imageUrlDesktop: desktopUrl,
      imageUrlMobile: mobileUrl,
      thumbnailUrl: thumbUrl,
      storagePath: basePath,
    };
  } catch (storageError) {
    console.warn('Firebase Storage upload notice, using optimized client WebP:', storageError);
    onProgress?.(100);
    // Graceful fallback: return the high-efficiency WebP data URLs
    return {
      imageUrlDesktop: processed.desktopDataUrl,
      imageUrlMobile: processed.mobileDataUrl,
      thumbnailUrl: processed.thumbDataUrl,
      storagePath: '',
    };
  }
}
