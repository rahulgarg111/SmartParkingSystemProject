import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "parkingSpaces";

export const getAllParkingSpaces = async () => {
  try{
    const snapshot = await getDocs(collection(db,COLLECTION));
    return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  }catch(error){
    console.log(error)
    return [];
  }
};

export const getAvailableParkingSpaces = async () => {
  const q = query(
    collection(db, COLLECTION),
    where("isAvailable", "==", true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(space => space.availableSpots > 0);
};

export const getParkingSpaceById = async (id) => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateParkingSpaceAvailability = async (id, availableSpots) => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const capacity = docSnap.data().capacity;
  const clamped = Math.max(0, Math.min(availableSpots, capacity));
  await updateDoc(docRef, {
    availableSpots: clamped,
    isAvailable: clamped > 0
  });
};
