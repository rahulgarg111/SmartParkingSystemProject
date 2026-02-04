/**
 * Pure utility functions for booking calculations
 * These are extracted for easy unit testing
 */

export const checkPeakHour = (startTime) => {
  const hour = new Date(startTime).getHours();
  return hour >= 8 && hour < 10;
};

export const calculateDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.ceil((end - start) / (1000 * 60 * 60));
};

export const calculateSurcharge = (baseAmount, isPeakHour) => {
  return isPeakHour ? Math.round(baseAmount * 0.10) : 0;
};

export const calculateReferralDiscount = (totalAmount) => {
  return Math.round(totalAmount * 0.05);
};

export const calculateTotalAmount = (duration, pricePerHour, isPeakHour, hasReferral) => {
  const baseAmount = duration * pricePerHour;
  const surcharge = calculateSurcharge(baseAmount, isPeakHour);
  let total = baseAmount + surcharge;
  if (hasReferral) {
    total -= calculateReferralDiscount(total);
  }
  return Math.round(total * 100) / 100;
};
