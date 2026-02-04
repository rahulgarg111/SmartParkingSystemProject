import { useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useBooking } from '../contexts';
import BookingForm from '../components/BookingForm';
import ThemeToggle from '../components/common/ThemeToggle';

const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { showBookingForm, selectedSpace, closeBookingForm } = useBooking();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate]);

  const handleBookingSuccess = useCallback(() => {
    closeBookingForm();
    navigate('/dashboard/bookings');
  }, [closeBookingForm, navigate]);

  return (
    <div className="App">
      <div className="parking-container">
        <div className="header">
          <h1>Parking System</h1>
          <div className="header-right">
            <ThemeToggle />
            <span className="user-email">{currentUser?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>

        <nav className="nav-tabs">
          <NavLink
            to="spaces"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Available Spaces
          </NavLink>
          <NavLink
            to="bookings"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            My Bookings
          </NavLink>
          <NavLink
            to="referrals"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            Referral Program
          </NavLink>
        </nav>

        {/* Child routes render here */}
        <Outlet />

        {/* Booking Form Modal */}
        {showBookingForm && selectedSpace && (
          <BookingForm
            onBookingSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
