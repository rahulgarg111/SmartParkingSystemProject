import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { registerUser, loginUser, logoutUser, getUserProfile } from '../services/auth';
import { seedParkingSpaces } from '../seedFirestore';
import { expireOverdueBookings } from '../services/bookings';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);

        // Fetch user profile for additional data like name
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }

        // Initialize parking data
        await initParkingData();
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setIsLoggedIn(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const initParkingData = async () => {
    try {
      await seedParkingSpaces();
      await expireOverdueBookings();
    } catch (error) {
      console.error('Error initializing parking data:', error);
    }
  };

  const login = useCallback(async (email, password) => {
    return loginUser(email, password);
  }, []);

  const register = useCallback(async (name, email, password) => {
    return registerUser(name, email, password);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
    setIsLoggedIn(false);
  }, []);

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    userId: currentUser?.uid,
    userName: userProfile?.name || currentUser?.displayName || 'User',
    isLoggedIn,
    authLoading,
    login,
    register,
    logout
  }), [currentUser, userProfile, isLoggedIn, authLoading, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
