import { Routes, Route, Navigate } from 'react-router-dom';
import { ParkingProvider, BookingProvider } from './contexts';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import ParkingSpaces from './pages/ParkingSpaces';
import SpaceDetails from './components/SpaceDetails';
import UserBookings from './components/UserBookings';
import ReferralDashboard from './components/ReferralDashboard';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ParkingProvider>
              <BookingProvider>
                <DashboardLayout />
              </BookingProvider>
            </ParkingProvider>
          </ProtectedRoute>
        }
      >
        {/* Nested routes - render inside DashboardLayout's <Outlet /> */}
        <Route index element={<Navigate to="spaces" replace />} />
        <Route path="spaces" element={<ParkingSpaces />} />
        <Route path="spaces/:spaceId" element={<SpaceDetails />} />
        <Route path="bookings" element={<UserBookings />} />
        <Route path="referrals" element={<ReferralDashboard />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
