import { useState, useEffect, useCallback } from 'react';
import { getReferralStats, getOrCreateReferralCode } from '../services/referrals';
import { useAuth, useBooking } from '../contexts';

const ReferralDashboard = () => {
  const { userId, userName } = useAuth();
  const { refreshBookings } = useBooking();

  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchReferralData = useCallback(async () => {
    try {
      // Expire overdue bookings first to apply any pending referral rewards
      await refreshBookings();
      const data = await getReferralStats(userId, userName);
      setReferralData(data);
    } catch (error) {
      setError(error.message || 'Error fetching referral data');
    } finally {
      setLoading(false);
    }
  }, [userId, userName, refreshBookings]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const generateReferralCode = useCallback(async () => {
    try {
      setLoading(true);
      await getOrCreateReferralCode(userId, userName);
      await fetchReferralData();
    } catch (error) {
      setError(error.message || 'Error generating referral code');
    } finally {
      setLoading(false);
    }
  }, [userId, userName, fetchReferralData]);

  const copyReferralCode = useCallback(() => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [referralData?.referralCode]);

  if (loading) {
    return <div className="loading">Loading referral information...</div>;
  }

  if (!referralData) {
    return <div className="error">{error || 'Failed to load referral data'}</div>;
  }

  return (
    <div className="referral-section">
      <h2>Referral Program</h2>

      {!referralData.hasBookedParking ? (
        <div className="referral-requirement">
          <p>Complete your first parking booking to unlock your referral code!</p>
          <p>Once you book parking, you can:</p>
          <ul>
            <li>Get your unique referral code</li>
            <li>Earn rewards when friends use your code</li>
            <li>Both you and your friends get 5% discounts</li>
          </ul>
        </div>
      ) : !referralData.referralCode ? (
        <div className="generate-code-section">
          <p>You can now generate your referral code!</p>
          <button className="generate-btn" onClick={generateReferralCode}>
            Generate My Referral Code
          </button>
        </div>
      ) : (
        <>
          <div className="referral-code-display">
            <h4>Your Referral Code</h4>
            <div className="referral-code">{referralData.referralCode}</div>
            <button
              className="copy-btn"
              onClick={copyReferralCode}
              disabled={copySuccess}
            >
              {copySuccess ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          <div className="referral-instructions">
            <h4>How it works:</h4>
            <ul>
              <li>Share your code with friends</li>
              <li>They get 5% discount on their first booking</li>
              <li>You earn 5% of their booking amount as rewards</li>
              <li>Both discounts are applied automatically</li>
            </ul>
          </div>

          <div className="referral-stats">
            <div className="stat-card">
              <div className="stat-value">{referralData.userStats.totalReferrals}</div>
              <div className="stat-label">Friends Referred</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${referralData.userStats.totalRewards || 0}</div>
              <div className="stat-label">Rewards Earned</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">${referralData.userStats.totalSavings || 0}</div>
              <div className="stat-label">Your Savings</div>
            </div>
          </div>

          {referralData.referredUsers && referralData.referredUsers.length > 0 && (
            <div className="referred-users">
              <h4>Recent Referrals</h4>
              <div className="referral-list">
                {referralData.referredUsers.map((referral) => (
                  <div key={referral.user?.id || referral.referredAt} className="referral-item">
                    <div className="referral-info">
                      <span className="user-name">{referral.user.name}</span>
                      <span className="referral-date">
                        {new Date(referral.referredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="referral-reward">
                      +${referral.discountAmount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ReferralDashboard;
