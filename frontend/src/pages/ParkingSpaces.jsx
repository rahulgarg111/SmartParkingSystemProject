import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking, useBooking } from '../contexts';

const ParkingSpaces = () => {
  const { parkingSpaces, isLoading, checkAvailability } = useParking();
  const { openBookingForm } = useBooking();
  const navigate = useNavigate();

  const handleBookSpace = useCallback((space) => {
    openBookingForm(space);
  }, [openBookingForm]);

  const handleCheckAvailability = useCallback(async (space) => {
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
  }, [checkAvailability]);

  const handleViewDetails = useCallback((spaceId) => {
    navigate(`/dashboard/spaces/${spaceId}`);
  }, [navigate]);

  if (isLoading) {
    return <div className="loading">Loading parking spaces...</div>;
  }

  return (
    <>
      <h2>Available Parking Spaces</h2>
      <div className="parking-grid">
        {parkingSpaces.map(space => (
          <div key={space.id} className="parking-card">
            <h3>{space.name}</h3>
            <p className="address">{space.location.address}</p>
            <div className="space-info">
              <p>Capacity: {space.capacity}</p>
              <p>Available: {space.availableSpots}</p>
              <p>Price: ${space.pricePerHour}/hour</p>
            </div>
            <div className={`status ${space.isAvailable && space.availableSpots > 0 ? 'available' : 'full'}`}>
              {space.isAvailable && space.availableSpots > 0 ? 'Available' : 'Full'}
            </div>
            <div className="card-actions">
              {space.isAvailable && space.availableSpots > 0 ? (
                <button
                  className="book-btn"
                  onClick={() => handleBookSpace(space)}
                >
                  Book Now
                </button>
              ) : (
                <button
                  className="check-btn"
                  onClick={() => handleCheckAvailability(space)}
                >
                  Next Available?
                </button>
              )}
              <button
                className="details-btn"
                onClick={() => handleViewDetails(space.id)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ParkingSpaces;
