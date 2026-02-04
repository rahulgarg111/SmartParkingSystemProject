import { useState, useMemo, useCallback, useRef } from 'react';
import { createBooking } from '../services/bookings';
import { validateReferralCode } from '../services/referrals';
import { useAuth, useBooking } from '../contexts';

const BookingForm = ({ onBookingSuccess }) => {
  // Get data from contexts instead of props
  const { userId } = useAuth();
  const { selectedSpace: space, closeBookingForm } = useBooking();

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
  const referralTimeoutRef = useRef(null);

  const getNowString = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if ((name === 'startTime' || name === 'endTime') && value) {
      if (new Date(value) < new Date()) {
        alert('You cannot select a past date or time.');
        return;
      }
    }

    if (name === 'endTime' && value && formData.startTime) {
      if (new Date(value) <= new Date(formData.startTime)) {
        alert('End time must be after start time.');
        return;
      }
    }

    if (name === 'startTime' && value && formData.endTime) {
      if (new Date(formData.endTime) <= new Date(value)) {
        alert('Start time must be before end time.');
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const duration = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    return Math.ceil((end - start) / (1000 * 60 * 60));
  }, [formData.startTime, formData.endTime]);

  const isPeakHour = useMemo(() => {
    if (!formData.startTime) return false;
    const startTime = new Date(formData.startTime);
    const hour = startTime.getHours();
    return hour >= 8 && hour < 10;
  }, [formData.startTime]);

  const originalTotal = useMemo(() => {
    return duration * (space?.pricePerHour || 0);
  }, [duration, space?.pricePerHour]);

  const surcharge = useMemo(() => {
    if (isPeakHour) {
      return Math.round(originalTotal * 0.10 * 100) / 100;
    }
    return 0;
  }, [isPeakHour, originalTotal]);

  const finalTotal = useMemo(() => {
    const totalBeforeDiscount = originalTotal + surcharge;
    return totalBeforeDiscount - referralDiscount;
  }, [originalTotal, surcharge, referralDiscount]);

  const handleValidateReferral = useCallback(async (code) => {
    if (!code.trim()) {
      setReferralStatus(null);
      setReferralDiscount(0);
      return;
    }

    try {
      const result = await validateReferralCode(code, userId);
      if (result.valid) {
        setReferralStatus({
          valid: true,
          message: result.message,
          referrerName: result.referrerName
        });
        const totalBeforeDiscount = originalTotal + surcharge;
        setReferralDiscount(Math.round(totalBeforeDiscount * 0.05 * 100) / 100);
      } else {
        setReferralStatus({
          valid: false,
          message: result.message
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
  }, [userId, originalTotal, surcharge]);

  const handleReferralCodeChange = useCallback((e) => {
    const code = e.target.value;
    setFormData({
      ...formData,
      referralCode: code
    });

    clearTimeout(referralTimeoutRef.current);
    referralTimeoutRef.current = setTimeout(() => handleValidateReferral(code), 500);
  }, [handleValidateReferral]);

  const handleClose = useCallback(() => {
    closeBookingForm();
  }, [closeBookingForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const now = new Date();
    if (new Date(formData.startTime) < now) {
      alert('Start time cannot be in the past.');
      setLoading(false);
      return;
    }
    if (new Date(formData.endTime) < now) {
      alert('End time cannot be in the past.');
      setLoading(false);
      return;
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      alert('End time must be after start time.');
      setLoading(false);
      return;
    }

    try {
      const booking = await createBooking(userId, {
        parkingSpaceId: space.id,
        ...formData,
        referralCode: referralStatus?.valid ? formData.referralCode : ''
      });
      alert('Booking Confirmed! Please pay at the booth upon arrival.');
      if (onBookingSuccess) {
        onBookingSuccess(booking);
      }
      closeBookingForm();
    } catch (error) {
      setError(error.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!space) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Book Parking Space</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
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
                min={getNowString()}
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
                min={formData.startTime || getNowString()}
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
                    <span>Referred by {referralStatus.referrerName}. </span>
                  )}
                  {referralStatus.message}
                </div>
              )}
            </div>

            {formData.startTime && formData.endTime && (
              <div className="booking-summary">
                <p>Duration: {duration} hours</p>
                <p>Base Amount: ${originalTotal}</p>
                {isPeakHour && (
                  <p className="surcharge">Peak Hour Surcharge (8-10 AM): +${surcharge}</p>
                )}
                {referralDiscount > 0 && (
                  <p className="discount">Referral Discount (5%): -${referralDiscount}</p>
                )}
                <p><strong>Final Total: ${finalTotal}</strong></p>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
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
