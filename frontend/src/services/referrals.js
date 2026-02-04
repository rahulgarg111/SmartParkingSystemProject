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

const COLLECTION = "referrals";

const generateReferralCode = (name) => {
  const prefix = name.substring(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
};

export const getOrCreateReferralCode = async (userId, userName) => {
  // Check if user already has a referral code
  const q = query(
    collection(db, COLLECTION),
    where("referrerId", "==", userId)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const existing = snapshot.docs[0];
    return { id: existing.id, ...existing.data() };
  }

  // Check if user has booked parking
  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) throw new Error("User not found");
  const userData = userDoc.data();
  if (!userData.hasBookedParking) {
    throw new Error("You must complete at least one booking before generating a referral code");
  }

  // Create new referral
  const referral = {
    referrerId: userId,
    referrerName: userName,
    referralCode: generateReferralCode(userName),
    referredUsers: [],
    totalRewards: 0,
    totalReferrals: 0,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(collection(db, COLLECTION), referral);
  return { id: docRef.id, ...referral };
};

export const validateReferralCode = async (code, currentUserId) => {
  const q = query(
    collection(db, COLLECTION),
    where("referralCode", "==", code.toUpperCase()),
    where("isActive", "==", true)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { valid: false, message: "Invalid referral code" };
  }

  const referral = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

  if (referral.referrerId === currentUserId) {
    return { valid: false, message: "You cannot use your own referral code" };
  }

  const alreadyReferred = referral.referredUsers.some(
    (r) => r.userId === currentUserId
  );
  if (alreadyReferred) {
    return { valid: false, message: "You have already used this referral code" };
  }

  return {
    valid: true,
    message: "Referral code valid! You'll get a 5% discount.",
    referrerName: referral.referrerName,
    referralId: referral.id
  };
};

export const applyReferral = async (referralCode, userId, bookingId, discountAmount) => {
  const q = query(
    collection(db, COLLECTION),
    where("referralCode", "==", referralCode.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const referralDoc = snapshot.docs[0];
  const referral = referralDoc.data();

  const rewardAmount = Math.round(discountAmount * 100) / 100;

  await updateDoc(doc(db, COLLECTION, referralDoc.id), {
    referredUsers: [
      ...referral.referredUsers,
      {
        userId,
        bookingId,
        discountAmount,
        referredAt: new Date().toISOString()
      }
    ],
    totalRewards: (referral.totalRewards || 0) + rewardAmount,
    totalReferrals: (referral.totalReferrals || 0) + 1
  });

  // Update referrer's stats
  const referrerDoc = await getDoc(doc(db, "users", referral.referrerId));
  if (referrerDoc.exists()) {
    const referrerData = referrerDoc.data();
    await updateDoc(doc(db, "users", referral.referrerId), {
      "referralStats.totalRewards": (referrerData.referralStats?.totalRewards || 0) + rewardAmount,
      "referralStats.totalReferrals": (referrerData.referralStats?.totalReferrals || 0) + 1
    });
  }
};

export const getReferralStats = async (userId, userName) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  const userData = userDoc.exists() ? userDoc.data() : {};

  const q = query(
    collection(db, COLLECTION),
    where("referrerId", "==", userId)
  );
  const snapshot = await getDocs(q);

  let referralCode = null;
  let referredUsers = [];
  if (!snapshot.empty) {
    const referral = snapshot.docs[0].data();
    referralCode = referral.referralCode;
    referredUsers = referral.referredUsers || [];

    // Resolve referred user names
    const resolvedUsers = [];
    for (const ref of referredUsers) {
      const refUserDoc = await getDoc(doc(db, "users", ref.userId));
      resolvedUsers.push({
        ...ref,
        user: refUserDoc.exists()
          ? { name: refUserDoc.data().name }
          : { name: "Unknown" }
      });
    }
    referredUsers = resolvedUsers;
  }

  return {
    hasBookedParking: userData.hasBookedParking || false,
    referralCode,
    referredUsers,
    userStats: {
      totalReferrals: userData.referralStats?.totalReferrals || 0,
      totalRewards: userData.referralStats?.totalRewards || 0,
      totalSavings: userData.referralStats?.totalSavings || 0
    }
  };
};
