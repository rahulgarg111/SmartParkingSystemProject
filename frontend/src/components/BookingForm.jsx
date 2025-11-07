import { useState } from 'react';

const BookingForm = ({ space, onClose, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    vehicleNumber: '',
    notes: '',
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referralStatus, setReferralStatus] = useState(null);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [surchargeAmount, setSurchargeAmount] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    return Math.ceil((end - start) / (1000 * 60 * 60));
  };

  const calculateOriginalTotal = () => {
    return calculateDuration() * space.pricePerHour;
  };

  const checkPeakHour = () => {
    if (!formData.startTime) return false;
    const startTime = new Date(formData.startTime);
    const hour = startTime.getHours();
    return hour >= 8 && hour < 10; // Peak hours: 8 AM - 10 AM
  };

  const calculateSurcharge = () => {
    const isPeak = checkPeakHour();
    if (isPeak) {
      const original = calculateOriginalTotal();
      return Math.round(original * 0.10 * 100) / 100; // 10% surcharge
    }
    return 0;
  };

  const calculateTotal = () => {
    const original = calculateOriginalTotal();
    const surcharge = calculateSurcharge();
    const totalBeforeDiscount = original + surcharge;
    return totalBeforeDiscount - referralDiscount;
  };

  const validateReferralCode = async (code) => {
    if (!code.trim()) {
      setReferralStatus(null);
      setReferralDiscount(0);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/referrals/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setReferralStatus({
          valid: true,
          message: data.message,
          referrerName: data.data.referrerName
        });
        const original = calculateOriginalTotal();
        const surcharge = calculateSurcharge();
        const totalBeforeDiscount = original + surcharge;
        setReferralDiscount(Math.round(totalBeforeDiscount * 0.05 * 100) / 100);
      } else {
        setReferralStatus({
          valid: false,
          message: data.message
        });
        setReferralDiscount(0);
      }
    } catch (error) {
      setReferralStatus({
        valid: false,
        message: 'Error validating referral code'
      });
      setReferralDiscount(0);
    }
  };

  const handleReferralCodeChange = (e) => {
    const code = e.target.value;
    setFormData({
      ...formData,
      referralCode: code
    });
    
    // Debounce the validation
    clearTimeout(window.referralTimeout);
    window.referralTimeout = setTimeout(() => validateReferralCode(code), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          parkingSpaceId: space._id,
          ...formData
        }),
      });

      const data = await response.json();
      if (response.ok) {
        onBookingSuccess(data.booking);
        onClose();
      } else {
        setError(data.message || 'Booking failed');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Book Parking Space</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="space-info">
            <h3>{space.name}</h3>
            <p>{space.location.address}</p>
            <p>Price: ${space.pricePerHour}/hour</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Start Time:</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time:</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Vehicle Number:</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                placeholder="ABC-123"
                required
              />
            </div>

            <div className="form-group">
              <label>Notes (optional):</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special instructions..."
              />
            </div>

            <div className="form-group">
              <label>Referral Code (optional):</label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleReferralCodeChange}
                placeholder="Enter referral code for 5% discount"
                style={{ textTransform: 'uppercase' }}
              />
              {referralStatus && (
                <div className={`referral-status ${referralStatus.valid ? 'valid' : 'invalid'}`}>
                  {referralStatus.valid && referralStatus.referrerName && (
                    <span>✓ Referred by {referralStatus.referrerName}. </span>
                  )}
                  {referralStatus.message}
                </div>
              )}
            </div>

            {formData.startTime && formData.endTime && (
              <div className="booking-summary">
                <p>Duration: {calculateDuration()} hours</p>
                <p>Base Amount: ${calculateOriginalTotal()}</p>
                {checkPeakHour() && (
                  <p className="surcharge">Peak Hour Surcharge (8-10 AM): +${calculateSurcharge()}</p>
                )}
                {referralDiscount > 0 && (
                  <p className="discount">Referral Discount (5%): -${referralDiscount}</p>
                )}
                <p><strong>Final Total: ${calculateTotal()}</strong></p>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;