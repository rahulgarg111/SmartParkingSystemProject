# SmartParking System - Netlify Deployment

This SmartParking System is now configured for deployment on Netlify with serverless functions.

## Deployment Instructions

### 1. Prerequisites
- MongoDB Atlas account (free tier available)
- Netlify account
- Git repository

### 2. MongoDB Setup
1. Create a MongoDB Atlas cluster
2. Get your connection string (replace `<username>`, `<password>`, and `<cluster>`)
3. Whitelist Netlify's IP addresses or use `0.0.0.0/0` for all IPs

### 3. Netlify Deployment

#### Option A: Continuous Deployment (Recommended)
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Netlify will auto-detect the `netlify.toml` configuration

#### Option B: Manual Deployment
1. Build locally: `npm run build`
2. Deploy the `frontend/dist` folder via Netlify dashboard

### 4. Environment Variables
Set these in Netlify dashboard (Site Settings > Environment Variables):

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartparking?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
```

### 5. API Endpoints
After deployment, your API will be available at:
- `https://your-site.netlify.app/api/auth/*`
- `https://your-site.netlify.app/api/parking-spaces/*`
- `https://your-site.netlify.app/api/bookings/*`
- `https://your-site.netlify.app/api/payments/*`
- `https://your-site.netlify.app/api/location-updates/*`
- `https://your-site.netlify.app/api/referrals/*`

## Local Development

```bash
# Install all dependencies
npm run install-all

# Start backend development server
npm run dev

# Build frontend
cd frontend && npm run build
```

## Project Structure
```
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       ├── api.js           # Serverless function entry point
│       └── package.json     # Functions dependencies
├── backend/                 # Express.js backend
├── frontend/               # React frontend
└── package.json           # Root package.json
```

## Features
- User authentication with JWT
- Parking space management
- Booking system
- Payment processing
- Real-time location updates
- Referral system
- MongoDB integration
- Responsive React frontend

## Testing
```bash
cd backend && npm test
```