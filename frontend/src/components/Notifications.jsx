import { useState, useEffect } from 'react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [radius, setRadius] = useState(5);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLocationNotifications = async () => {
    if (!userLocation.latitude || !userLocation.longitude) {
      alert('Please allow location access to subscribe to notifications');
      return;
    }

    setSubscribing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: radius
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`✅ Subscribed! Found ${data.subscribedSpaces} parking spaces within ${radius}km.`);
        fetchNotifications();
      } else {
        alert(data.message || 'Subscription failed');
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setSubscribing(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
        )}
      </div>

      <div className="location-subscription">
        <h3>Location-Based Notifications</h3>
        <p>Get notified when parking spaces become available near you</p>
        <div className="subscription-controls">
          <div className="form-group">
            <label>Search Radius (km):</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              min="1"
              max="50"
            />
          </div>
          <button
            className="subscribe-btn"
            onClick={subscribeToLocationNotifications}
            disabled={subscribing || !userLocation.latitude}
          >
            {subscribing ? 'Subscribing...' : 'Find Nearby Parking'}
          </button>
        </div>
        {userLocation.latitude && (
          <p className="location-info">
            📍 Current location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </p>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notifications-actions">
          <button onClick={markAllAsRead}>Mark All as Read</button>
        </div>
      )}

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet</p>
            <p>Subscribe to location-based notifications to get alerts about nearby parking</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-header">
                <span className="notification-type">{notification.type}</span>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="notification-content">
                <p>{notification.message}</p>
                {notification.parkingSpace && (
                  <div className="parking-details">
                    <strong>{notification.parkingSpace.name}</strong>
                    <p>{notification.parkingSpace.location?.address}</p>
                    {notification.metadata?.distance && (
                      <p className="distance">📍 {notification.metadata.distance} km away</p>
                    )}
                  </div>
                )}
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification._id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => deleteNotification(notification._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
