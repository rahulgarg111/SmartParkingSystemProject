# SmartParking System

> A full-stack web application for intelligent parking space booking and management with real-time availability tracking, location-based notifications, and an integrated referral program.

LIVE - https://earnest-empanada-a90776.netlify.app/                                                                                                                                                                  VIDEO WALKTHROUGH - https://youtu.be/QLpNNJ59hQM

## Overview

SmartParking System is a comprehensive parking management solution that enables users to find, book, and pay for parking spaces in real-time. The platform features location-based notifications, dynamic pricing during peak hours, and a referral program that rewards users for bringing friends to the platform.

## Features

### Core Features
- **User Authentication** - Secure JWT-based authentication with password hashing
- **Parking Space Management** - Browse and search available parking spaces with real-time availability
- **Smart Booking System** - Create, view, modify, and cancel parking reservations
- **Payment Processing** - Integrated payment system with multiple payment methods
- **Real-time Updates** - Live parking space availability updates
- **Comprehensive Testing** - Full test suite with Jest

### Advanced Features
- **Location-Based Notifications** 🔔
  - Subscribe to notifications based on your location
  - Custom radius settings (1-50 km)
  - Real-time alerts when parking becomes available nearby
  - Uses Haversine formula for accurate distance calculation

- **Dynamic Pricing** 💰
  - Peak hour surcharges (10% extra during 8-10 AM)
  - Automatic calculation and transparent pricing
  - Detailed breakdown in booking confirmations

- **Referral Program** 🎁
  - Generate unique referral codes
  - 5% discount for referred users
  - 5% reward credit for referrers
  - Leaderboard and statistics tracking
  - One-time use per user to prevent abuse

## Technology Stack

### Backend
- **Runtime:** Node.js (>=18.0.0)
- **Framework:** Express.js 5.1.0
- **Database:** MongoDB with Mongoose 8.17.2
- **Authentication:** JWT (jsonwebtoken 9.0.2) + bcryptjs 3.0.2
- **Testing:** Jest 29.7.0 + Supertest 7.0.0
- **Other:** CORS 2.8.5, dotenv 17.2.1, Nodemon 3.1.10

### Frontend
- **Library:** React 19.1.1
- **Build Tool:** Vite 7.1.2
- **Routing:** React Router DOM 7.1.2
- **Styling:** CSS3 with custom styles

### Deployment
- **Platform:** Netlify (Serverless Functions)
- **Wrapper:** serverless-http 3.2.0
- **Node Version:** 20
- **Bundler:** esbuild

## Project Structure

```
smart parking system/
├── backend/                      # Node.js/Express API server
│   ├── models/                   # Mongoose data models
│   │   ├── User.js              # User model with referral stats
│   │   ├── ParkingSpace.js      # Parking space model
│   │   ├── Booking.js           # Booking model with pricing
│   │   ├── Payment.js           # Payment transaction model
│   │   ├── Referral.js          # Referral system model
│   │   └── Notification.js      # Location-based notifications
│   ├── routes/                   # API route handlers
│   │   ├── auth.js              # Authentication routes
│   │   ├── parkingSpaces.js     # Parking space routes
│   │   ├── bookings.js          # Booking routes
│   │   ├── payments.js          # Payment routes
│   │   ├── referrals.js         # Referral routes
│   │   ├── locationUpdates.js   # Real-time update routes
│   │   └── notifications.js     # Notification routes
│   ├── middleware/               # Custom middleware
│   │   └── auth.js              # JWT authentication middleware
│   ├── tests/                    # Jest test suite
│   │   ├── auth.test.js         # Authentication tests
│   │   ├── booking.test.js      # Booking tests
│   │   ├── parking.test.js      # Parking space tests
│   │   └── setup.js             # Test configuration
│   ├── server.js                 # Main server entry point
│   └── seedData.js               # Database seeding script
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── BookingForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── UserBookings.jsx
│   │   │   ├── ReferralDashboard.jsx
│   │   │   └── Notifications.jsx
│   │   ├── App.jsx              # Main application component
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── vite.config.js           # Vite configuration
│   └── package.json             # Frontend dependencies
├── netlify/                      # Serverless deployment
│   └── functions/
│       ├── api.js               # Netlify serverless function
│       └── package.json         # Functions dependencies
├── netlify.toml                 # Netlify deployment config
├── .env.example                 # Environment variables template
└── package.json                 # Root package scripts
```

## Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** (MongoDB Atlas account for cloud deployment)
- **npm** or **yarn** package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd smart-parking-system
```

### 2. Install Dependencies

```bash
# Install all dependencies (backend, frontend, and functions)
npm run install-all
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartparking?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
PORT=5000
```

**Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-here` |
| `NODE_ENV` | Application environment | `development` or `production` |
| `PORT` | Backend server port | `5000` |

> **Note:** For MongoDB Atlas, whitelist your IP address or use `0.0.0.0/0` for all IPs (not recommended for production).

### 4. Seed the Database (Optional)

```bash
cd backend
npm run seed
```

This creates:
- 8 sample parking spaces
- 1 owner user account

## Running the Application

### Development Mode

```bash
# Start backend server with nodemon (auto-reload)
npm run dev

# In another terminal, start frontend dev server
cd frontend
npm run dev
```

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5173 (Vite default)

### Production Mode

```bash
# Build frontend
npm run build

# Start backend in production mode
npm start
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run install-all` | Install all dependencies (root, backend, frontend, functions) |
| `npm run build` | Build frontend for production |
| `npm run dev` | Start backend development server with nodemon |
| `npm start` | Start backend production server |
| `npm test` | Run backend test suite |

## API Documentation

All API endpoints are prefixed with `/api`.

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user, returns JWT | No |

### Parking Space Routes (`/api/parking-spaces`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/` | List all parking spaces | No |
| GET | `/available` | List only available spaces | No |
| GET | `/:id` | Get specific parking space | No |

### Booking Routes (`/api/bookings`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/` | Create new booking (supports referral code) | Yes |
| GET | `/` | Get user's bookings | Yes |
| GET | `/:id` | Get specific booking | Yes |
| PUT | `/:id` | Update booking | Yes |
| DELETE | `/:id` | Cancel booking | Yes |
| PATCH | `/:id/status` | Update booking status | Yes |

### Payment Routes (`/api/payments`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/process` | Process payment | Yes |
| GET | `/` | Get user's payments | Yes |
| GET | `/:id` | Get specific payment | Yes |
| POST | `/:id/refund` | Request payment refund | Yes |
| GET | `/history/:bookingId` | Get payment history for booking | Yes |

### Referral Routes (`/api/referrals`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/my-code` | Get/generate user's referral code | Yes |
| GET | `/stats` | Get user's referral statistics | Yes |
| POST | `/validate` | Validate referral code | Yes |
| GET | `/leaderboard` | Get top referrers leaderboard | No |
| GET | `/admin/all` | Admin view all referrals | Yes |

### Location Update Routes (`/api/location-updates`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/update-availability` | Update parking space availability | Yes |
| POST | `/simulate-updates` | Simulate real-time updates | Yes |
| GET | `/status/:parkingSpaceId` | Get space status | No |
| POST | `/bulk-update` | Bulk update multiple spaces | Yes |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/subscribe` | Subscribe to location-based notifications | Yes |
| GET | `/` | Get all user's notifications | Yes |
| GET | `/unread-count` | Get unread notification count | Yes |
| PATCH | `/:id/read` | Mark notification as read | Yes |
| PATCH | `/read-all` | Mark all notifications as read | Yes |
| DELETE | `/:id` | Delete notification | Yes |

## Database Models

### User Model
- `name`, `email`, `password` (bcrypt hashed)
- `hasBookedParking` - tracking flag
- `referralStats` - total rewards, referrals, and savings
- `comparePassword()` method for authentication

### ParkingSpace Model
- `name`, `location` (address + coordinates)
- `capacity`, `availableSpots`, `pricePerHour`
- `isAvailable` status, `owner` reference

### Booking Model
- User and parking space references
- Start/end time, duration, total amount
- Status: pending, confirmed, active, completed, cancelled
- Payment status: pending, paid, failed, refunded
- `vehicleNumber`, optional `notes`
- Referral info: code, referrer, discount amount
- Surcharge info: peak hour flag, amount, percentage

### Payment Model
- Booking and user references
- Payment methods, amounts, status tracking
- Transaction IDs and metadata

### Referral Model
- Unique referral codes (6-character uppercase)
- Referrer and referred user tracking
- Discount and reward amounts
- Usage tracking and statistics

### Notification Model
- Location-based notifications with lat/lng coordinates
- User subscriptions with custom radius
- Read/unread status tracking
- Automatic cleanup of old notifications

## Testing

The project includes a comprehensive test suite using Jest and Supertest.

```bash
# Run all tests
cd backend
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

**Test Coverage:**
- Authentication (registration, login)
- Booking creation and management
- Parking space queries
- API endpoint validation

## Deployment

### Netlify Deployment

#### Option A: Continuous Deployment (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Netlify will auto-detect `netlify.toml` configuration
4. Set environment variables in Netlify dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`

#### Option B: Manual Deployment

1. Build locally: `npm run build`
2. Deploy the `frontend/dist` folder via Netlify dashboard
3. Configure functions directory: `netlify/functions`

**Your deployed API will be available at:**
- `https://your-site.netlify.app/api/*`

### MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster (free tier available)
2. Get your connection string
3. Whitelist Netlify's IP addresses or use `0.0.0.0/0` for all IPs
4. Add connection string to Netlify environment variables

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with 10 salt rounds
- **Environment Variables** - Sensitive data stored securely
- **CORS Configuration** - Cross-origin request protection
- **Input Validation** - Request validation on all endpoints
- **Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.
- **MongoDB Injection Protection** - Mongoose schema validation

## Sample Data

Sample JSON files are included for reference:
- `sample_bookings.json` - Example booking records
- `sample_parking_spaces.json` - Example parking spaces
- `sample_payments.json` - Example payment transactions

## Known Limitations

- Payment gateway is simulated (90% success rate for testing)
- Notifications stored in database but no WebSocket real-time push
- Location updates don't automatically trigger notification push
- No email/SMS notification integration yet

## Future Enhancements

- Real-time WebSocket notifications
- Email/SMS notification integration
- Advanced analytics dashboard
- Mobile app (React Native)
- Integration with real payment gateways (Stripe, PayPal)
- QR code-based check-in/check-out
- Admin dashboard for parking space owners

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ using Node.js, React, and MongoDB**
