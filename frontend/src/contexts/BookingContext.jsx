import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { expireOverdueBookings } from '../services/bookings';

const BookingContext = createContext(null);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const openBookingForm = useCallback((space) => {
    setSelectedSpace(space);
    setShowBookingForm(true);
  }, []);

  const closeBookingForm = useCallback(() => {
    setSelectedSpace(null);
    setShowBookingForm(false);
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      await expireOverdueBookings();
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    }
  }, []);

  const value = useMemo(() => ({
    selectedSpace,
    showBookingForm,
    openBookingForm,
    closeBookingForm,
    refreshBookings
  }), [selectedSpace, showBookingForm, openBookingForm, closeBookingForm, refreshBookings]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
