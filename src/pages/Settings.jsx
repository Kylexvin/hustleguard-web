// src/pages/Settings.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faStore, 
  faBell,
  faLock,
  faPalette,
  faLanguage,
  faChevronRight,
  faRightFromBracket,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './css/Settings.css';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: faUser, label: 'Profile', description: 'Name, email, phone', path: '/settings/profile' },
    { icon: faStore, label: 'Shop Details', description: 'Shop name, address', path: '/settings/shop' },
    { icon: faBell, label: 'Notifications', description: 'Alert preferences', path: '/settings/notifications' },
    { icon: faLock, label: 'Security', description: 'Change password', path: '/settings/security' },
    { icon: faPalette, label: 'Appearance', description: 'Theme, colors', path: '/settings/appearance' },
    { icon: faLanguage, label: 'Language', description: 'English, Swahili', path: '/settings/language' },
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <h2>Settings</h2>
      </div>

      {/* Profile Card */}
      <div className="settings-profile">
        <div className="settings-avatar">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="settings-profile-info">
          <h3>{user?.name || 'User'}</h3>
          <p>{user?.email || 'user@email.com'}</p>
          <span className="settings-role">{user?.role || 'Owner'}</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="settings-menu">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            className="settings-menu-item"
            onClick={() => navigate(item.path)}
          >
            <div className="settings-menu-left">
              <div className="settings-menu-icon">
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <div>
                <div className="settings-menu-label">{item.label}</div>
                <div className="settings-menu-desc">{item.description}</div>
              </div>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="settings-menu-arrow" />
          </div>
        ))}
      </div>

      {/* Logout & Danger */}
      <div className="settings-actions">
        <button className="settings-logout-btn" onClick={logout}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
        <button className="settings-delete-btn">
          <FontAwesomeIcon icon={faTrash} /> Delete Account
        </button>
      </div>

      {/* Version */}
      <div className="settings-version">
        <p>HustleGuard v1.0.0</p>
      </div>
    </div>
  );
}