import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getEarliestEndingBooking } from '../services/bookings';
import { useAuth } from './AuthContext';

const ParkingContext = createContext(null);

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};

export const ParkingProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener for parking spaces
  useEffect(() => {
    if (!isLoggedIn) {
      setParkingSpaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, 'parkingSpaces'),
      (snapshot) => {
        const spaces = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParkingSpaces(spaces);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching parking spaces:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isLoggedIn]);

  const getSpaceById = useCallback((spaceId) => {
    return parkingSpaces.find(space => space.id === spaceId);
  }, [parkingSpaces]);

  const checkAvailability = useCallback(async (space) => {
    try {
      const earliest = await getEarliestEndingBooking(space.id);
      if (earliest) {
        const endTime = new Date(earliest.endTime);
        return {
          available: false,
          nextAvailable: endTime.toLocaleString()
        };
      }
      return {
        available: true,
        nextAvailable: null
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    parkingSpaces,
    isLoading,
    getSpaceById,
    checkAvailability
  }), [parkingSpaces, isLoading, getSpaceById, checkAvailability]);

  return (
    <ParkingContext.Provider value={value}>
      {children}
    </ParkingContext.Provider>
  );
};
