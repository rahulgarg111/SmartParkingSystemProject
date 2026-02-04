# SmartParking System

> A modern React web application for intelligent parking space booking with real-time availability tracking, Firebase backend, and an integrated referral program.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## Overview

SmartParking System is a serverless parking management solution built with React and Firebase. Users can browse parking spaces with real-time availability, make reservations, and earn rewards through a referral program. The application features dynamic pricing during peak hours and a dark/light theme toggle.

## Features

### Core Features
- **User Authentication** - Firebase Authentication with email/password
- **Real-time Parking Availability** - Live updates via Firestore listeners
- **Smart Booking System** - Create, view, and cancel parking reservations
- **Dynamic Pricing** - 10% surcharge during peak hours (8-10 AM)
- **Dark/Light Theme** - Persistent theme preference with localStorage

### Referral Program
- Generate unique 6-character referral codes
- 5% discount for referred users on their first booking
- 5% reward credit for referrers
- Statistics tracking (total referrals, rewards earned, savings)
- One-time use per user to prevent abuse

## Technology Stack

### Frontend
- **React** 19.1.1
- **Vite** 7.1.2 (Build Tool)
- **React Router DOM** 7.1.2 (Client-side Routing)
- **CSS3** with custom theming

### Backend (Firebase)
- **Firebase Authentication** - User management
- **Cloud Firestore** - NoSQL database with real-time sync

### Development
- **Vitest** 4.0.18 (Testing)
- **ESLint** 9.33.0 (Linting)

### Deployment
- **Netlify** (Static hosting)
- **Node Version** 20

## Project Structure

```
smart parking system/
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── common/           # Shared components
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── ThemeToggle.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   ├── ReferralDashboard.jsx
│   │   │   ├── SpaceDetails.jsx
│   │   │   └── UserBookings.jsx
│   │   ├── contexts/             # React Context providers
│   │   │   ├── AuthContext.jsx   # Authentication state
│   │   │   ├── BookingContext.jsx # Booking UI state
│   │   │   ├── ParkingContext.jsx # Real-time parking data
│   │   │   ├── ThemeContext.jsx  # Theme management
│   │   │   └── index.js
│   │   ├── pages/                # Route pages
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── ParkingSpaces.jsx
│   │   ├── services/             # Firebase service layer
│   │   │   ├── auth.js           # Authentication functions
│   │   │   ├── bookings.js       # Booking CRUD operations
│   │   │   ├── bookingUtils.js   # Pricing calculations
│   │   │   ├── parkingSpaces.js  # Parking space queries
│   │   │   └── referrals.js      # Referral system
│   │   ├── firebase.js           # Firebase configuration
│   │   ├── seedFirestore.js      # Database seeding script
│   │   ├── App.jsx               # Main application
│   │   ├── App.css               # Global styles
│   │   ├── main.jsx              # Entry point
│   │   └── index.css
│   ├── .env                      # Environment variables
│   ├── vite.config.js
│   └── package.json
├── netlify.toml                  # Deployment configuration
└── package.json                  # Root scripts
```

## Prerequisites

- **Node.js** >= 18.0.0
- **Firebase Project** with Authentication and Firestore enabled
- **npm** package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd smart-parking-system
```

### 2. Install Dependencies

```bash
npm run install-all
```

Or manually:

```bash
cd frontend
npm install
```

### 3. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with Email/Password provider
3. Enable **Cloud Firestore** database
4. Get your Firebase configuration from Project Settings

### 4. Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Seed the Database (Optional)

Import the `seedFirestore.js` functions to populate initial parking spaces:

```javascript
import { seedParkingSpaces } from './seedFirestore';
seedParkingSpaces();
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at **http://localhost:5173**

### Production Build

```bash
npm run build
```

Build output is generated in `frontend/dist/`

### Preview Production Build

```bash
cd frontend
npm run preview
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build frontend for production |
| `npm run install-all` | Install frontend dependencies |
| `npm run lint` | Run ESLint (from frontend/) |
| `npm run test` | Run Vitest tests (from frontend/) |

## Firestore Collections

### users
```javascript
{
  name: string,
  email: string,
  hasBookedParking: boolean,
  referralStats: {
    totalRewards: number,
    totalReferrals: number,
    totalSavings: number
  },
  createdAt: timestamp
}
```

### parkingSpaces
```javascript
{
  name: string,
  location: {
    address: string,
    coordinates: { lat: number, lng: number }
  },
  capacity: number,
  availableSpots: number,
  pricePerHour: number,
  isAvailable: boolean
}
```

### bookings
```javascript
{
  userId: string,
  parkingSpaceId: string,
  startTime: timestamp,
  endTime: timestamp,
  duration: number,
  totalAmount: number,
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled',
  vehicleNumber: string,
  notes: string (optional),
  surchargeInfo: {
    isPeakHour: boolean,
    surchargeAmount: number,
    surchargePercentage: number
  },
  referralInfo: {
    referralCode: string,
    discountAmount: number
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### referrals
```javascript
{
  referrerId: string,
  referrerName: string,
  referralCode: string (6-char uppercase),
  referredUsers: [{
    userId: string,
    bookingId: string,
    discountAmount: number,
    referredAt: timestamp
  }],
  totalRewards: number,
  totalReferrals: number,
  isActive: boolean,
  createdAt: timestamp
}
```

## Application Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | LoginPage | Authentication (login/register) |
| `/dashboard` | DashboardLayout | Main app shell (protected) |
| `/dashboard/spaces` | ParkingSpaces | Browse parking spaces |
| `/dashboard/spaces/:id` | SpaceDetails | View space details |
| `/dashboard/bookings` | UserBookings | User's booking history |
| `/dashboard/referrals` | ReferralDashboard | Referral code & stats |

## Testing

```bash
cd frontend
npm run test        # Watch mode
npm run test:run    # Single run
```

## Deployment

### Netlify Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Netlify auto-detects `netlify.toml` configuration
4. Set environment variables in Netlify dashboard (all `VITE_FIREBASE_*` variables)

**Configuration in `netlify.toml`:**
- Build command: `cd frontend && npm install && npm run build`
- Publish directory: `frontend/dist`
- SPA redirect: All routes redirect to `/index.html`

### Firebase Security Rules

Set up Firestore security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /parkingSpaces/{spaceId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /referrals/{referralId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Security Features

- **Firebase Authentication** - Secure user management
- **Environment Variables** - Sensitive config stored securely
- **Protected Routes** - Auth-required pages
- **Firestore Rules** - Database-level access control
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, X-XSS-Protection

## Known Limitations

- Payment is assumed to be handled at the parking booth (no online payment)
- No push notifications (notifications would require Firebase Cloud Messaging)
- No admin dashboard for parking space owners

## Future Enhancements

- Push notifications via Firebase Cloud Messaging
- Integration with payment gateways (Stripe, PayPal)
- Admin dashboard for parking space management
- Mobile app (React Native)
- QR code-based check-in/check-out
- Email notifications

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Built with React and Firebase**
