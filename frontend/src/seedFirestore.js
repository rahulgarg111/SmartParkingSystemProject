/**
 * Run this script once to populate Firestore with initial parking space data.
 * Usage: Open the app in the browser, open the developer console, and run:
 *   import('./seedFirestore.js').then(m => m.seedParkingSpaces())
 *
 * Or import and call seedParkingSpaces() from any component temporarily.
 */
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const parkingSpacesData = [
  {
    name: "Downtown Parking Garage",
    location: {
      address: "123 Main Street, Downtown",
      coordinates: { lat: 40.7128, lng: -74.006 },
    },
    capacity: 200,
    availableSpots: 45,
    pricePerHour: 5,
    isAvailable: true,
  },
  {
    name: "Shopping Mall Parking",
    location: {
      address: "789 Commerce Blvd, Retail District",
      coordinates: { lat: 40.758, lng: -73.9855 },
    },
    capacity: 300,
    availableSpots: 0,
    pricePerHour: 4,
    isAvailable: false,
  },
  {
    name: "University Campus Lot",
    location: {
      address: "321 College Avenue, University District",
      coordinates: { lat: 40.7295, lng: -73.9965 },
    },
    capacity: 150,
    availableSpots: 30,
    pricePerHour: 2,
    isAvailable: true,
  },
  {
    name: "Hospital Visitor Parking",
    location: {
      address: "555 Medical Center Drive",
      coordinates: { lat: 40.7614, lng: -73.9776 },
    },
    capacity: 100,
    availableSpots: 15,
    pricePerHour: 6,
    isAvailable: true,
  },
  {
    name: "Beach Front Parking",
    location: {
      address: "100 Ocean Drive, Beachside",
      coordinates: { lat: 40.5731, lng: -73.9712 },
    },
    capacity: 250,
    availableSpots: 80,
    pricePerHour: 7,
    isAvailable: true,
  },
  {
    name: "VIP Executive Parking",
    location: {
      address: "1 Premium Plaza, Central Business District",
      coordinates: { lat: 40.7580, lng: -73.9855 },
    },
    capacity: 2,
    availableSpots: 2,
    pricePerHour: 50,
    isAvailable: true,
  },
];

export const seedParkingSpaces = async () => {
  // Check if data already exists
  const existing = await getDocs(collection(db, "parkingSpaces"));
  if (!existing.empty) {
    console.log(
      `Parking spaces collection already has ${existing.size} documents. Skipping seed.`,
    );
    return;
  }

  console.log("Seeding parking spaces...");
  for (const space of parkingSpacesData) {
    const docRef = await addDoc(collection(db, "parkingSpaces"), {
      ...space,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`Added: ${space.name} (${docRef.id})`);
  }
  console.log("Seeding complete!");
};
