// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncUser, getUserRole } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  // Guard against re-entrant auth state changes
  const processingRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Prevent concurrent calls from overlapping
      if (processingRef.current) return;
      processingRef.current = true;

      if (firebaseUser) {
        try {
          // 1. Sync user to MongoDB — non-fatal if fails
          try {
            await syncUser({
              name:  firebaseUser.displayName,
              photo: firebaseUser.photoURL,
            });
          } catch (syncErr) {
            // syncUser failure is non-fatal — continue to get role
            console.warn('[Auth] syncUser failed (non-fatal):', syncErr.message);
          }

          // 2. Get role from backend — fallback to 'user' if fails
          let role = 'user';
          let recyclerData = null;
          try {
            const { data } = await getUserRole();
            role         = data.role         || 'user';
            recyclerData = data.recyclerData || null;
          } catch (roleErr) {
            console.warn('[Auth] getUserRole failed, defaulting to user:', roleErr.message);
          }

          setUser({
            uid:          firebaseUser.uid,
            name:         firebaseUser.displayName || '',
            email:        firebaseUser.email        || '',
            photo:        firebaseUser.photoURL      || '',
            role,
            recyclerData,
          });
        } catch (err) {
          // Absolute last-resort catch — still set a basic user object so app doesn't blank
          console.error('[Auth] unexpected error in auth handler:', err.message);
          setUser({
            uid:   firebaseUser.uid,
            name:  firebaseUser.displayName || '',
            email: firebaseUser.email        || '',
            photo: firebaseUser.photoURL      || '',
            role:  'user',
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
      processingRef.current = false;
    });

    return unsub;
  }, []);

  const logout = async () => {
    try { await signOut(auth); } catch (_) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
