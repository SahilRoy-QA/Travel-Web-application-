import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import {
  defaultBranding,
  defaultFeatureFlags,
  defaultPolicies,
  defaultSections,
} from '../services/seedData';
import {
  BrandingSettings,
  FeatureFlags,
  HomepageSection,
  PolicySettings,
} from '../types';

interface SettingsContextType {
  branding: BrandingSettings;
  sections: HomepageSection[];
  featureFlags: FeatureFlags;
  policies: PolicySettings;
  loading: boolean;
  updateBranding: (data: Partial<BrandingSettings>) => Promise<void>;
  updateSections: (sections: HomepageSection[]) => Promise<void>;
  updateFeatureFlags: (data: Partial<FeatureFlags>) => Promise<void>;
  updatePolicies: (data: Partial<PolicySettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [sections, setSections] = useState<HomepageSection[]>(defaultSections);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  const [policies, setPolicies] = useState<PolicySettings>(defaultPolicies);
  const [loading, setLoading] = useState(true);

  // Apply branding CSS variables to document root dynamically
  useEffect(() => {
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty('--brand-primary', branding.primaryColor);
    }
    if (branding.accentColor) {
      root.style.setProperty('--brand-accent', branding.accentColor);
    }
    if (branding.brandName) {
      document.title = `${branding.brandName} - ${branding.tagline || 'Travel & Hotel Booking'}`;
    }
  }, [branding]);

  // Real-time onSnapshot listeners for all settings
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    try {
      const unsubBranding = onSnapshot(
        doc(db, 'settings', 'branding'),
        (snapshot) => {
          if (snapshot.exists()) {
            setBranding({ ...defaultBranding, ...snapshot.data() } as BrandingSettings);
          }
        },
        (error) => {
          console.warn('Branding onSnapshot notice:', error.message);
        }
      );
      unsubs.push(unsubBranding);

      const unsubSections = onSnapshot(
        doc(db, 'settings', 'sections'),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (Array.isArray(data.list) && data.list.length > 0) {
              // Sort by order
              const sorted = [...data.list].sort((a, b) => a.order - b.order);
              setSections(sorted);
            }
          }
        },
        (error) => {
          console.warn('Sections onSnapshot notice:', error.message);
        }
      );
      unsubs.push(unsubSections);

      const unsubFlags = onSnapshot(
        doc(db, 'settings', 'featureFlags'),
        (snapshot) => {
          if (snapshot.exists()) {
            setFeatureFlags({ ...defaultFeatureFlags, ...snapshot.data() } as FeatureFlags);
          }
        },
        (error) => {
          console.warn('FeatureFlags onSnapshot notice:', error.message);
        }
      );
      unsubs.push(unsubFlags);

      const unsubPolicies = onSnapshot(
        doc(db, 'settings', 'policies'),
        (snapshot) => {
          if (snapshot.exists()) {
            setPolicies({ ...defaultPolicies, ...snapshot.data() } as PolicySettings);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Policies onSnapshot notice:', error.message);
          setLoading(false);
        }
      );
      unsubs.push(unsubPolicies);
    } catch (err) {
      console.warn('Settings listener init error:', err);
      setLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  const updateBranding = async (data: Partial<BrandingSettings>) => {
    const updated = { ...branding, ...data };
    try {
      await setDoc(doc(db, 'settings', 'branding'), updated, { merge: true });
      setBranding(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/branding');
    }
  };

  const updateSections = async (newSections: HomepageSection[]) => {
    try {
      await setDoc(doc(db, 'settings', 'sections'), { list: newSections });
      setSections(newSections);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/sections');
    }
  };

  const updateFeatureFlags = async (data: Partial<FeatureFlags>) => {
    const updated = { ...featureFlags, ...data };
    try {
      await setDoc(doc(db, 'settings', 'featureFlags'), updated, { merge: true });
      setFeatureFlags(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/featureFlags');
    }
  };

  const updatePolicies = async (data: Partial<PolicySettings>) => {
    const updated = { ...policies, ...data };
    try {
      await setDoc(doc(db, 'settings', 'policies'), updated, { merge: true });
      setPolicies(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/policies');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        branding,
        sections,
        featureFlags,
        policies,
        loading,
        updateBranding,
        updateSections,
        updateFeatureFlags,
        updatePolicies,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
