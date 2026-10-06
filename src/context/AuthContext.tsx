import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

const SUPER_ADMIN_EMAILS = [
  'roysahil579@gmail.com',
  'dassahil3@gmail.com',
  'sahildas@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === email.toLowerCase());
};

export const getDefaultDisplayNameForEmail = (email?: string | null, fallback?: string): string => {
  if (!email) return fallback || 'Traveler';
  const lower = email.toLowerCase().trim();
  if (lower === 'dassahil3@gmail.com' || lower === 'sahildas@gmail.com') {
    return 'Test_User_1';
  }
  if (lower === 'roysahil579@gmail.com') {
    return 'Dev_Lead';
  }
  return fallback || email.split('@')[0].replace(/[._-]/g, ' ');
};

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
  quickSignIn: (email: string, displayName: string, targetRole?: UserRole) => Promise<void>;
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

        try {
          const userSnap = await getDoc(userRef);
          const isOwner = isSuperAdminEmail(currentUser.email);
          const lowerEmail = currentUser.email?.toLowerCase().trim() || '';

          // Determine expected display name for specific accounts
          let designatedName = currentUser.displayName;
          if (lowerEmail === 'dassahil3@gmail.com' || lowerEmail === 'sahildas@gmail.com') {
            designatedName = 'Test_User_1';
          } else if (lowerEmail === 'roysahil579@gmail.com') {
            designatedName = 'Dev_Lead';
          } else if (!designatedName) {
            designatedName = currentUser.isAnonymous ? 'Guest Traveler' : 'Traveler';
          }

          // If the auth profile has a different name than designated for designated emails, update it
          if (
            (lowerEmail === 'dassahil3@gmail.com' ||
              lowerEmail === 'sahildas@gmail.com' ||
              lowerEmail === 'roysahil579@gmail.com') &&
            currentUser.displayName !== designatedName
          ) {
            try {
              await updateProfile(currentUser, { displayName: designatedName });
            } catch (pErr) {
              console.warn('Could not update currentUser auth profile:', pErr);
            }
          }

          if (!userSnap.exists()) {
            const initialRole: UserRole = isOwner ? 'super_admin' : 'customer';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: designatedName,
              role: initialRole,
              isBlocked: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          } else {
            const existingData = userSnap.data() as UserProfile;
            let needsDocUpdate = false;
            const updatePayload: Partial<UserProfile> = {};

            // Super Admin auto-elevation check
            if (isOwner && existingData.role !== 'super_admin') {
              existingData.role = 'super_admin';
              updatePayload.role = 'super_admin';
              needsDocUpdate = true;
            }

            // Enforce Test_User_1 for dassahil3@gmail.com and Dev_Lead for roysahil579@gmail.com
            if (
              (lowerEmail === 'dassahil3@gmail.com' ||
                lowerEmail === 'sahildas@gmail.com' ||
                lowerEmail === 'roysahil579@gmail.com') &&
              existingData.displayName !== designatedName
            ) {
              existingData.displayName = designatedName;
              updatePayload.displayName = designatedName;
              needsDocUpdate = true;
            }

            if (needsDocUpdate) {
              await updateDoc(userRef, updatePayload);
            }
            setUserProfile(existingData);
          }

          // Ensure super admin account is linked with the requested password Illusio@006574
          if (isOwner && currentUser.email) {
            try {
              const credential = EmailAuthProvider.credential(currentUser.email, 'Illusio@006574');
              await linkWithCredential(currentUser, credential);
            } catch (linkErr: any) {
              if (
                linkErr.code === 'auth/credential-already-in-use' ||
                linkErr.code === 'auth/provider-already-linked'
              ) {
                try {
                  await updatePassword(currentUser, 'Illusio@006574');
                } catch {
                  // Ignore if requires recent-login
                }
              }
            }
          }

          // Live listener for profile changes (role upgrade, block status, etc.)
          unsubProfile = onSnapshot(
            userRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data() as UserProfile);
              }
            },
            (error) => {
              console.warn('Profile listener notice:', error.message);
            }
          );
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

  // Email/Password Login with intelligent auto-creation fallback
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setUser(cred.user);
    } catch (err: any) {
      // If the account doesn't exist or credentials fail on first setup, auto-create
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, pass);
          const computedName = getDefaultDisplayNameForEmail(email);
          await updateProfile(newCred.user, { displayName: computedName });

          const isOwner = isSuperAdminEmail(email);
          const newProfile: UserProfile = {
            uid: newCred.user.uid,
            email: email,
            displayName: computedName,
            role: isOwner ? 'super_admin' : 'customer',
            isBlocked: false,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', newCred.user.uid), newProfile);
          setUserProfile(newProfile);
          setUser(newCred.user);
          return;
        } catch {
          // If auto-create failed, rethrow original error
          throw err;
        }
      }
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const resolvedName = getDefaultDisplayNameForEmail(email, name);
    await updateProfile(cred.user, { displayName: resolvedName });

    const isOwner = isSuperAdminEmail(email);
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || '',
      displayName: resolvedName,
      phoneNumber: phone,
      role: isOwner ? 'super_admin' : 'customer',
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

  // Google Sign-In with safe popup handling
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/unauthorized-domain') {
        throw new Error(
          'Google Sign-in domain not yet authorized in Firebase Console. Please use Email Sign-In or 1-Click login below.'
        );
      }
      if (code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by browser. Please allow popups or use Email Sign-In.');
      }
      if (code === 'auth/popup-closed-by-user') {
        return; // User intentionally dismissed popup
      }
      throw error;
    }
  };

  // Instant 1-Click Sign-In (Solves web preview iframe limitations)
  const quickSignIn = async (email: string, displayName?: string, targetRole: UserRole = 'customer') => {
    const isOwner = isSuperAdminEmail(email);
    const role: UserRole = isOwner ? 'super_admin' : targetRole;
    const resolvedName = getDefaultDisplayNameForEmail(email, displayName);

    try {
      // Try with dedicated standard password
      await signInWithEmailAndPassword(auth, email, 'Illusio@006574');
    } catch {
      try {
        // If not registered, create with default password
        const newCred = await createUserWithEmailAndPassword(auth, email, 'Illusio@006574');
        await updateProfile(newCred.user, { displayName: resolvedName });

        const profile: UserProfile = {
          uid: newCred.user.uid,
          email,
          displayName: resolvedName,
          role,
          isBlocked: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', newCred.user.uid), profile);
        setUserProfile(profile);
        setUser(newCred.user);
      } catch {
        // Fallback to anonymous authenticated session with customized profile
        const anonCred = await signInAnonymously(auth);
        await updateProfile(anonCred.user, { displayName: resolvedName });

        const profile: UserProfile = {
          uid: anonCred.user.uid,
          email,
          displayName: resolvedName,
          role,
          isBlocked: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', anonCred.user.uid), profile);
        setUserProfile(profile);
        setUser(anonCred.user);
      }
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
        quickSignIn,
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
