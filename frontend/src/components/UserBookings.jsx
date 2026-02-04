import { useState, useEffect, useCallback } from 'react';
import { getUserBookings, cancelBooking } from '../services/bookings';
import { useAuth, useBooking } from '../contexts';

const STATUS_COLORS = {
  pending: '#ffc107',
  confirmed: '#28a745',
  active: '#17a2b8',
  completed: '#6c757d',
  cancelled: '#dc3545'
};

const UserBookings = () => {
  const { userId } = useAuth();
  const { refreshBookings } = useBooking();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      // Expire overdue bookings first to update statuses
      await refreshBookings();
      const data = await getUserBookings(userId);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, refreshBookings]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = useCallback(async (bookingId) => {
    try {
      await cancelBooking(bookingId, userId);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  }, [userId, fetchBookings]);

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  return (
    <div className="bookings-container">
      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.parkingSpace?.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: STATUS_COLORS[booking.status] || '#6c757d' }}
                >
                  {booking.status.toUpperCase()}
                </span>
              </div>

              <div className="booking-details">
                <p><strong>Address:</strong> {booking.parkingSpace?.location?.address}</p>
                <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                <p><strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(booking.endTime).toLocaleString()}</p>
                <p><strong>Duration:</strong> {booking.duration} hours</p>
                <p><strong>Amount:</strong> ${booking.totalAmount} (pay at booth)</p>
                {booking.surchargeInfo?.isPeakHour && (
                  <p className="surcharge-info">
                    <strong>Peak Hour Surcharge (8-10 AM):</strong> +${booking.surchargeInfo.surchargeAmount}
                  </p>
                )}
                {booking.referralInfo?.discountAmount > 0 && (
                  <p className="discount-info">
                    <strong>Referral Discount:</strong> -${booking.referralInfo.discountAmount}
                  </p>
                )}
                {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
              </div>

              <div className="booking-actions">
                {(booking.status === 'confirmed' || booking.status === 'pending') && (
                  <button
                    className="cancel-btn"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
