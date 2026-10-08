import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  defaultBranding,
  defaultFeatureFlags,
  defaultPolicies,
  defaultSections,
  sampleBanners,
  sampleCoupons,
  sampleDestinations,
  sampleHotels,
  samplePackages,
  sampleServices,
} from './seedData';

export async function ensureInitialSettings() {
  try {
    const brandingRef = doc(db, 'settings', 'branding');
    const brandingSnap = await getDoc(brandingRef);

    if (!brandingSnap.exists()) {
      await setDoc(brandingRef, defaultBranding);
      await setDoc(doc(db, 'settings', 'sections'), { list: defaultSections });
      await setDoc(doc(db, 'settings', 'featureFlags'), defaultFeatureFlags);
      await setDoc(doc(db, 'settings', 'policies'), defaultPolicies);
      console.log('Default settings seeded to Firestore.');
    }

    // Ensure core coupons exist in Firestore
    try {
      const couponsSnap = await getDocs(collection(db, 'coupons'));
      if (couponsSnap.empty) {
        for (const cp of sampleCoupons) {
          await setDoc(doc(db, 'coupons', cp.id), {
            ...cp,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore if offline or read-only
    }
  } catch (error) {
    console.warn('Initial settings check skipped or offline:', error);
  }
}

export async function seedAllDemoData(onProgress?: (msg: string) => void) {
  try {
    onProgress?.('Seeding Platform Settings...');
    await setDoc(doc(db, 'settings', 'branding'), defaultBranding);
    await setDoc(doc(db, 'settings', 'sections'), { list: defaultSections });
    await setDoc(doc(db, 'settings', 'featureFlags'), defaultFeatureFlags);
    await setDoc(doc(db, 'settings', 'policies'), defaultPolicies);

    onProgress?.('Seeding Destinations...');
    for (const dest of sampleDestinations) {
      await setDoc(doc(db, 'destinations', dest.id), {
        ...dest,
        createdAt: new Date().toISOString(),
      });
    }

    onProgress?.('Seeding Hotels & Rooms...');
    for (const hotel of sampleHotels) {
      const { rooms, ...hotelData } = hotel;
      await setDoc(doc(db, 'hotels', hotel.id), {
        ...hotelData,
        createdAt: new Date().toISOString(),
      });

      for (const room of rooms) {
        await setDoc(doc(db, 'rooms', room.id), {
          ...room,
          createdAt: new Date().toISOString(),
        });
      }
    }

    onProgress?.('Seeding Tour Packages...');
    for (const pkg of samplePackages) {
      await setDoc(doc(db, 'packages', pkg.id), {
        ...pkg,
        createdAt: new Date().toISOString(),
      });
    }

    onProgress?.('Seeding Travel Services...');
    for (const srv of sampleServices) {
      await setDoc(doc(db, 'services', srv.id), {
        ...srv,
        createdAt: new Date().toISOString(),
      });
    }

    onProgress?.('Seeding Coupons & Banners...');
    for (const cp of sampleCoupons) {
      await setDoc(doc(db, 'coupons', cp.id), {
        ...cp,
        createdAt: new Date().toISOString(),
      });
    }

    for (const bn of sampleBanners) {
      await setDoc(doc(db, 'banners', bn.id), {
        ...bn,
        createdAt: new Date().toISOString(),
      });
    }

    onProgress?.('Seeding Complete!');
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedAllDemoData');
    return false;
  }
}
