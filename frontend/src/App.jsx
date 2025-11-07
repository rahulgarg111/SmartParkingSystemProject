  import { useState, useEffect } from 'react'
  import './App.css'
  import BookingForm from './components/BookingForm'
  import UserBookings from './components/UserBookings'
  import ReferralDashboard from './components/ReferralDashboard'
  import Notifications from './components/Notifications'

  function App() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [parkingSpaces, setParkingSpaces] = useState([]);
    const [activeTab, setActiveTab] = useState('spaces');
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: ''
    });

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        fetchParkingSpaces();
      }
    }, []);

    const fetchParkingSpaces = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/parking-spaces');
        const data = await response.json();
        if (data.success) {
          setParkingSpaces(data.data);
        }
      } catch (error) {
        console.error('Error fetching parking spaces:', error);
      }
    };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const url = isLogin ? 'http://localhost:5000/api/auth/login' : 'http://localhost:5000/api/auth/register';
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          setIsLoggedIn(true);
          fetchParkingSpaces();
        } else {
          alert(data.message || 'Error occurred');
        }
      } catch (error) {
        alert('Network error');
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setParkingSpaces([]);
      setActiveTab('spaces');
      setFormData({ email: '', password: '', name: '' });
    };

    const handleBookSpace = (space) => {
      setSelectedSpace(space);
      setShowBookingForm(true);
    };

    const handleBookingSuccess = () => {
      fetchParkingSpaces();
      setShowBookingForm(false);
      setSelectedSpace(null);
    };

    if (isLoggedIn) {
      return (
        <div className="App">
          <div className="parking-container">
            <div className="header">
              <h1>Parking System</h1>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>

            <div className="nav-tabs">
              <button
                className={activeTab === 'spaces' ? 'active' : ''}
                onClick={() => setActiveTab('spaces')}
              >
                Available Spaces
              </button>
              <button
                className={activeTab === 'bookings' ? 'active' : ''}
                onClick={() => setActiveTab('bookings')}
              >
                My Bookings
              </button>
              <button
                className={activeTab === 'notifications' ? 'active' : ''}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
              <button
                className={activeTab === 'referrals' ? 'active' : ''}
                onClick={() => setActiveTab('referrals')}
              >
                Referral Program
              </button>
            </div>

            {activeTab === 'spaces' && (
              <>
                <h2>Available Parking Spaces</h2>
                <div className="parking-grid">
                  {parkingSpaces.map(space => (
                    <div key={space._id} className="parking-card">
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
                      {space.isAvailable && space.availableSpots > 0 && (
                        <button 
                          className="book-btn" 
                          onClick={() => handleBookSpace(space)}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'bookings' && <UserBookings />}

            {activeTab === 'notifications' && <Notifications />}

            {activeTab === 'referrals' && <ReferralDashboard />}

            {showBookingForm && selectedSpace && (
              <BookingForm
                space={selectedSpace}
                onClose={() => {
                  setShowBookingForm(false);
                  setSelectedSpace(null);
                }}
                onBookingSuccess={handleBookingSuccess}
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="App">
        <div className="auth-container">
          <h1>Parking System</h1>
          <div className="auth-toggle">
            <button 
              className={isLogin ? 'active' : ''} 
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={!isLogin ? 'active' : ''} 
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit">
              {isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  export default App
