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
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import './css/MobileLayout.css';

export default function MobileLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { label: 'Home', icon: faHome, path: '/' },
    { label: 'Sell', icon: faCashRegister, path: '/pos' },
    { label: 'Stock', icon: faBox, path: '/products' },
    { label: 'Alerts', icon: faBell, path: '/alerts' },
  ];

  const currentPath = location.pathname;

  // Check if path matches (including sub-routes)
  const isActive = (path) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <div className="mobile-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <div>
          <div className="top-bar-sub">HustleGuard</div>
          <div className="top-bar-shop">
            <FontAwesomeIcon icon={faStore} className="top-bar-icon" />
            <span>{user?.shopName || 'My Shop'}</span>
          </div>
        </div>
        <div className="top-bar-avatar" onClick={() => setMenuOpen(!menuOpen)}>
          <FontAwesomeIcon icon={faUser} />
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-item">{user?.name}</div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={logout}>
                <FontAwesomeIcon icon={faRightFromBracket} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content">
        <Outlet />
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
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