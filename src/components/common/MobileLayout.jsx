// src/components/common/MobileLayout.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faCashRegister, 
  faBox, 
  faBell,
  faStore,
  faUser,
  faRightFromBracket,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './css/MobileLayout.css';

export default function MobileLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const bottomNavRef = useRef(null);
  const [bottomNavHeight, setBottomNavHeight] = useState(70);
  const notifRef = useRef(null);

  // Measure bottom nav height
  useEffect(() => {
    if (bottomNavRef.current) {
      setBottomNavHeight(bottomNavRef.current.offsetHeight);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/alerts/unread/count');
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotif(true);
      const response = await axios.get('/alerts?limit=5');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotif(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n._id);
      
      if (unreadIds.length === 0) return;

      await axios.put('/alerts/mark-read', { alertIds: unreadIds });
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Toggle notification dropdown
  const toggleNotif = () => {
    if (!notifOpen) {
      fetchNotifications();
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
    setNotifOpen(!notifOpen);
  };

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { label: 'Home', icon: faHome, path: '/' },
    { label: 'Sell', icon: faCashRegister, path: '/pos' },
    { label: 'Stock', icon: faBox, path: '/products' },
    { label: 'Alerts', icon: faBell, path: '/alerts' },
  ];

  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  return (
    <div className="mobile-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="top-bar-sub">HustleGuard</div>
          <div className="top-bar-shop">
            <FontAwesomeIcon icon={faStore} className="top-bar-icon" />
            <span>{user?.shopName || 'My Shop'}</span>
          </div>
        </div>
        <div className="top-bar-right">
          {/* Notification Bell */}
          <div className="top-bar-notif-wrapper" ref={notifRef}>
            <button 
              className={`top-bar-notif-btn ${notifOpen ? 'active' : ''}`}
              onClick={toggleNotif}
            >
              <FontAwesomeIcon icon={faBell} />
              {unreadCount > 0 && (
                <span className="top-bar-notif-badge">{unreadCount}</span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="top-bar-notif-dropdown">
                <div className="notif-header">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="notif-unread-count">{unreadCount} unread</span>
                  )}
                </div>
                
                {loadingNotif ? (
                  <div className="notif-loading">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  <>
                    {notifications.slice(0, 5).map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                        onClick={() => {
                          setNotifOpen(false);
                          navigate('/alerts');
                        }}
                      >
                        <div className="notif-item-icon">
                          {getSeverityIcon(notif.severity)}
                        </div>
                        <div className="notif-item-content">
                          <div className="notif-item-title">{notif.title}</div>
                          <div className="notif-item-message">{notif.message}</div>
                          <div className="notif-item-time">
                            {new Date(notif.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="notif-view-all"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate('/alerts');
                      }}
                    >
                      View All Alerts
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="top-bar-avatar" onClick={() => setMenuOpen(!menuOpen)}>
            <FontAwesomeIcon icon={faUser} />
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item">{user?.name}</div>
                <div className="dropdown-item">{user?.email}</div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={logout}>
                  <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Pass bottom nav height as CSS variable */}
      <div 
        className="mobile-content"
        style={{ 
          '--bottom-nav-height': `${bottomNavHeight}px`,
          paddingBottom: `${bottomNavHeight}px`
        }}
      >
        <Outlet />
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav" ref={bottomNavRef}>
        {tabs.map((tab) => (
          <div
            key={tab.path}
            className={`nav-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <FontAwesomeIcon icon={tab.icon} />
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}