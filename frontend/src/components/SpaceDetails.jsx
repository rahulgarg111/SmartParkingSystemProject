import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useParking, useBooking } from '../contexts';

const SpaceDetails = () => {
  // useParams extracts dynamic segments from the URL
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { getSpaceById, checkAvailability, isLoading } = useParking();
  const { openBookingForm } = useBooking();

  const space = getSpaceById(spaceId);

  const handleBook = useCallback(() => {
    openBookingForm(space);
  }, [space, openBookingForm]);

  const handleCheckAvailability = useCallback(async () => {
    try {
      const result = await checkAvailability(space);
      if (result.nextAvailable) {
        alert(`Next slot opens: ${result.nextAvailable}`);
      } else {
        alert('No active bookings found - space should be available soon!');
      }
    } catch (error) {
      alert('Could not check availability');
    }
  }, [space, checkAvailability]);

  const handleGoBack = useCallback(() => {
    navigate(-1); // Go back to previous page
  }, [navigate]);

  if (isLoading) {
    return <div className="loading">Loading space details...</div>;
  }

  if (!space) {
    return (
      <div className="space-details not-found">
        <h2>Space Not Found</h2>
        <p>The parking space with ID "{spaceId}" could not be found.</p>
        <button onClick={() => navigate('/dashboard/spaces')} className="back-btn">
          Back to Spaces
        </button>
      </div>
    );
  }

  const isAvailable = useMemo(() =>
    space.isAvailable && space.availableSpots > 0,
    [space.isAvailable, space.availableSpots]
  );

  const occupancyPercent = useMemo(() =>
    Math.round(((space.capacity - space.availableSpots) / space.capacity) * 100),
    [space.capacity, space.availableSpots]
  );

  return (
    <div className="space-details">
      <button onClick={handleGoBack} className="back-btn">
        ← Back
      </button>

      <div className="space-details-card">
        <div className="space-header">
          <h2>{space.name}</h2>
          <span className={`status-badge ${isAvailable ? 'available' : 'full'}`}>
            {isAvailable ? 'Available' : 'Full'}
          </span>
        </div>

        <div className="space-location">
          <h3>Location</h3>
          <p className="address">{space.location.address}</p>
          {space.location.coordinates && (
            <p className="coordinates">
              Coordinates: {space.location.coordinates.lat}, {space.location.coordinates.lng}
            </p>
          )}
        </div>

        <div className="space-stats">
          <div className="stat">
            <span className="stat-label">Total Capacity</span>
            <span className="stat-value">{space.capacity}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Available Spots</span>
            <span className="stat-value">{space.availableSpots}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Price per Hour</span>
            <span className="stat-value">${space.pricePerHour}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Occupancy</span>
            <span className="stat-value">
              {occupancyPercent}%
            </span>
          </div>
        </div>

        <div className="space-actions">
          {isAvailable ? (
            <button onClick={handleBook} className="book-btn primary">
              Book This Space
            </button>
          ) : (
            <button onClick={handleCheckAvailability} className="check-btn">
              Check Next Availability
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceDetails;
