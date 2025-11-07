import { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';

const UserBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handlePayment = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    fetchBookings();
    setShowPaymentForm(false);
    setSelectedBooking(null);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#ffc107',
      confirmed: '#28a745',
      active: '#17a2b8',
      completed: '#6c757d',
      cancelled: '#dc3545'
    };
    return statusColors[status] || '#6c757d';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      pending: '#ffc107',
      paid: '#28a745',
      failed: '#dc3545',
      refunded: '#6c757d'
    };
    return statusColors[status] || '#6c757d';
  };

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
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.parkingSpace?.name}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(booking.status) }}
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
                <p><strong>Total Amount:</strong> ${booking.totalAmount}</p>
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

              <div className="payment-status">
                <span 
                  className="payment-badge"
                  style={{ backgroundColor: getPaymentStatusColor(booking.paymentStatus) }}
                >
                  Payment: {booking.paymentStatus.toUpperCase()}
                </span>
              </div>

              <div className="booking-actions">
                {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                  <button 
                    className="pay-btn"
                    onClick={() => handlePayment(booking)}
                  >
                    Pay Now
                  </button>
                )}
                
                {booking.status === 'pending' || booking.status === 'confirmed' ? (
                  <button 
                    className="cancel-btn"
                    onClick={() => cancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {showPaymentForm && selectedBooking && (
        <PaymentForm
          booking={selectedBooking}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedBooking(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default UserBookings;