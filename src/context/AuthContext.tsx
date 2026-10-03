import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

const SUPER_ADMIN_EMAIL = 'roysahil579@gmail.com';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAgent: boolean;
  isVerified: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateUserContact: (name: string, phone?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile document with Firestore
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        // Check if redirect result is pending
        try {
          await getRedirectResult(auth);
        } catch {
          // Ignore redirect errors if not returning from one
        }

        try {
          const userSnap = await getDoc(userRef);
          const isOwnerEmail = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

          if (!userSnap.exists()) {
            const initialRole: UserRole = isOwnerEmail ? 'super_admin' : 'customer';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Guest Traveler',
              role: initialRole,
              isBlocked: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const existingData = userSnap.data() as UserProfile;
            // Super Admin auto-elevation check
            if (isOwnerEmail && existingData.role !== 'super_admin') {
              await updateDoc(userRef, { role: 'super_admin' });
              existingData.role = 'super_admin';
            }
            setUserProfile(existingData);
          }

          // Ensure super admin account is linked with the requested password Illusio@006574
          if (isOwnerEmail && currentUser.email) {
            try {
              const credential = EmailAuthProvider.credential(currentUser.email, 'Illusio@006574');
              await linkWithCredential(currentUser, credential);
              console.log('Super admin password linked: Illusio@006574');
            } catch (linkErr: any) {
              if (
                linkErr.code === 'auth/credential-already-in-use' ||
                linkErr.code === 'auth/provider-already-linked'
              ) {
                try {
                  await updatePassword(currentUser, 'Illusio@006574');
                  console.log('Super admin password updated to Illusio@006574');
                } catch {
                  // Ignore if requires recent-login
                }
              }
            }
          }

          // Live listener for profile changes (role upgrade, block status, etc.)
          unsubProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            }
          });
        } catch (err) {
          console.warn('Error fetching user profile:', err);
        }
      } else {
        setUserProfile(null);
        if (unsubProfile) unsubProfile();
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    setUser(cred.user);
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });

    const isOwnerEmail = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || '',
      displayName: name,
      phoneNumber: phone,
      role: isOwnerEmail ? 'super_admin' : 'customer',
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setUserProfile(newProfile);

    // Send email verification
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Verification email dispatch failed:', e);
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    try {
      if (isStandalone) {
        // TWA / PWA Standalone environment preferred redirect
        await signInWithRedirect(auth, provider);
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      // Fallback to redirect if popup fails or is blocked
      console.warn('Google popup interrupted, attempting redirect:', error);
      await signInWithRedirect(auth, provider);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const updateUserContact = async (name: string, phone?: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: name });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: name,
        ...(phone !== undefined ? { phoneNumber: phone } : {}),
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, displayName: name, phoneNumber: phone } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const role = userProfile?.role || 'customer';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isAgent = role === 'agent';
  const isVerified = Boolean(user?.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        isAdmin,
        isSuperAdmin,
        isAgent,
        isVerified,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        resendVerification,
        updateUserContact,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
