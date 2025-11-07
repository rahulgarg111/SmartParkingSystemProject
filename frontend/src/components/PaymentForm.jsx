import { useState } from 'react';

const PaymentForm = ({ booking, onClose, onPaymentSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: booking._id,
          paymentMethod: paymentData.paymentMethod,
          metadata: {
            cardholderName: paymentData.cardholderName,
            cardLastFour: paymentData.cardNumber.slice(-4),
            expiryDate: paymentData.expiryDate
          }
        }),
      });

      const data = await response.json();
      if (response.ok && data.payment.paymentStatus === 'completed') {
        alert('🎉 Payment Successful!\n\nYour parking booking has been confirmed. You will receive a confirmation email shortly.');
        onPaymentSuccess(data.payment);
        onClose();
      } else {
        setError(data.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Payment</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="payment-summary">
            <h3>Booking Summary</h3>
            <p>Space: {booking.parkingSpace?.name}</p>
            <p>Duration: {booking.duration} hours</p>
            <p><strong>Total Amount: ${booking.totalAmount}</strong></p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Payment Method:</label>
              <select
                name="paymentMethod"
                value={paymentData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="stripe">Stripe</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {paymentData.paymentMethod === 'cash' && (
              <div className="cash-payment-info">
                <div className="info-box">
                  <h4>Cash Payment Instructions</h4>
                  <p>Please pay in cash upon arrival at the parking location.</p>
                  <p>Present your booking confirmation to the parking attendant.</p>
                  <p><strong>Amount to pay: ${booking.totalAmount}</strong></p>
                </div>
              </div>
            )}

            {(paymentData.paymentMethod === 'credit_card' || paymentData.paymentMethod === 'debit_card') && (
              <>
                <div className="form-group">
                  <label>Cardholder Name:</label>
                  <input
                    type="text"
                    name="cardholderName"
                    value={paymentData.cardholderName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Card Number:</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date:</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>CVV:</label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handleChange}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && <div className="error">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 
                 paymentData.paymentMethod === 'cash' ? 
                 `Confirm Cash Payment ($${booking.totalAmount})` : 
                 `Pay $${booking.totalAmount}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;