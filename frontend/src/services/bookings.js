import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { getParkingSpaceById, updateParkingSpaceAvailability } from "./parkingSpaces";
import { applyReferral, validateReferralCode } from "./referrals";
import { checkPeakHour, calculateDuration, calculateSurcharge, calculateReferralDiscount } from "./bookingUtils";

const COLLECTION = "bookings";

export const createBooking = async (userId, bookingData) => {
  const {
    parkingSpaceId,
    startTime,
    endTime,
    vehicleNumber,
    notes,
    referralCode
  } = bookingData;

  const space = await getParkingSpaceById(parkingSpaceId);
  if (!space) throw new Error("Parking space not found");
  if (!space.isAvailable || space.availableSpots <= 0) {
    throw new Error("Parking space is not available");
  }

  const duration = calculateDuration(startTime, endTime);

  if (duration <= 0) throw new Error("End time must be after start time");

  const baseAmount = duration * space.pricePerHour;
  const isPeakHour = checkPeakHour(startTime);
  const surchargeAmount = calculateSurcharge(baseAmount, isPeakHour);

  let totalAmount = baseAmount + surchargeAmount;
  let referralInfo = null;

  if (referralCode) {
    const validation = await validateReferralCode(referralCode, userId);
    if (validation.valid) {
      referralInfo = {
        referralCode: referralCode.toUpperCase(),
        discountAmount: calculateReferralDiscount(totalAmount)
      };
      totalAmount -= referralInfo.discountAmount;
    }
  }

  const booking = {
    userId,
    parkingSpaceId,
    parkingSpace: {
      name: space.name,
      location: space.location,
      pricePerHour: space.pricePerHour
    },
    startTime,
    endTime,
    duration,
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: "confirmed",
    vehicleNumber,
    notes: notes || "",
    surchargeInfo: {
      isPeakHour,
      surchargeAmount,
      // surchargePercentage
    },
    referralInfo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTION), booking);

  // Decrement available spots
  await updateParkingSpaceAvailability(parkingSpaceId, space.availableSpots - 1);

  // Mark user as having booked parking (for referral eligibility)
  await updateDoc(doc(db, "users", userId), { hasBookedParking: true });

  return { id: docRef.id, ...booking };
};

export const getUserBookings = async (userId) => {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getBookingById = async (bookingId) => {
  const docSnap = await getDoc(doc(db, COLLECTION, bookingId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const cancelBooking = async (bookingId, userId) => {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  if (booking.userId !== userId) throw new Error("Unauthorized");
  if (booking.status === "cancelled") throw new Error("Booking already cancelled");
  if (booking.status === "completed") throw new Error("Booking already completed");

  await updateDoc(doc(db, COLLECTION, bookingId), {
    status: "cancelled",
    updatedAt: new Date().toISOString()
  });

  // Restore available spots
  const space = await getParkingSpaceById(booking.parkingSpaceId);
  if (space) {
    await updateParkingSpaceAvailability(booking.parkingSpaceId, space.availableSpots + 1);
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  await updateDoc(doc(db, COLLECTION, bookingId), {
    status:status,
    updatedAt: new Date().toISOString()
  });
};

export const expireOverdueBookings = async () => {
  const now = new Date();
  const activeStatuses = ["pending", "confirmed", "active"];

  for (const status of activeStatuses) {
    const q = query(
      collection(db, COLLECTION),
      where("status", "==", status)
    );
    const snapshot = await getDocs(q);

    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data();
      const endTime = new Date(booking.endTime);

      if (endTime <= now) {
        // Re-read to avoid double-processing from concurrent runs
        const fresh = await getDoc(doc(db, COLLECTION, bookingDoc.id));
        if (!fresh.exists()) continue;
        const freshData = fresh.data();
        if (freshData.status === "completed" || freshData.status === "cancelled") continue;

        await updateDoc(doc(db, COLLECTION, bookingDoc.id), {
          status: "completed",
          updatedAt: new Date().toISOString()
        });

        // Grant referral reward if booking had a referral code and hasn't been applied yet
        if (booking.referralInfo && booking.referralInfo.referralCode && !booking.referralApplied) {
          try {
            await applyReferral(
              booking.referralInfo.referralCode,
              booking.userId,
              bookingDoc.id,
              booking.referralInfo.discountAmount
            );
            await updateDoc(doc(db, COLLECTION, bookingDoc.id), {
              referralApplied: true
            });
          } catch (err) {
            console.error("Failed to apply referral reward:", err);
          }
        }

        // Restore the parking spot
        const space = await getParkingSpaceById(booking.parkingSpaceId);
        if (space) {
          await updateParkingSpaceAvailability(
            booking.parkingSpaceId,
            space.availableSpots + 1
          );
        }
      }
    }
  }
};

export const getEarliestEndingBooking = async (parkingSpaceId) => {
  const activeStatuses = ["confirmed", "active"];
  let allBookings = [];

  for (const status of activeStatuses) {
    const q = query(
      collection(db, COLLECTION),
      where("parkingSpaceId", "==", parkingSpaceId),
      where("status", "==", status)
    );
    const snapshot = await getDocs(q);
    allBookings = allBookings.concat(snapshot.docs.map(doc => doc.data()));
  }

  if (allBookings.length === 0) return null;

  const earliest = allBookings.reduce((min, b) =>
    new Date(b.endTime) < new Date(min.endTime) ? b : min
  );
  return earliest;
};
