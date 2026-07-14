// src/pages/Alerts.jsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCircleCheck, 
  faCircleXmark, 
  faTriangleExclamation,
  faClock,
  faCheck,
  faTrash,
  faCircle
} from '@fortawesome/free-solid-svg-icons';
import './css/Alerts.css';

export default function Alerts() {
  const [filter, setFilter] = useState('all'); // all, unread, resolved

  // Sample alerts - replace with API data
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'low_stock',
      severity: 'warning',
      title: 'Low Stock Alert',
      message: 'Laptop Pro has only 3 units remaining',
      product: 'Laptop Pro',
      time: '2 min ago',
      isRead: false,
      isResolved: false
    },
    {
      id: 2,
      type: 'out_of_stock',
      severity: 'critical',
      title: 'Out of Stock',
      message: 'USB Cable is completely out of stock',
      product: 'USB Cable',
      time: '15 min ago',
      isRead: false,
      isResolved: false
    },
    {
      id: 3,
      type: 'dead_stock',
      severity: 'warning',
      title: 'Dead Stock Alert',
      message: 'Office Chair has not been sold in 30 days',
      product: 'Office Chair',
      time: '1 hour ago',
      isRead: true,
      isResolved: false
    },
    {
      id: 4,
      type: 'price_change',
      severity: 'info',
      title: 'Supplier Price Change',
      message: 'Supplier price for Coffee Beans increased by 15%',
      product: 'Coffee Beans',
      time: '2 hours ago',
      isRead: true,
      isResolved: true
    },
    {
      id: 5,
      type: 'low_stock',
      severity: 'warning',
      title: 'Low Stock Alert',
      message: 'Notebook Set has only 2 units remaining',
      product: 'Notebook Set',
      time: '5 hours ago',
      isRead: true,
      isResolved: false
    }
  ]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return faCircleXmark;
      case 'warning':
        return faTriangleExclamation;
      case 'info':
        return faCircleCheck;
      default:
        return faBell;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#C0392B';
      case 'warning':
        return '#E65100';
      case 'info':
        return '#2D6B55';
      default:
        return '#7F8C8D';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical':
        return '#FDECEA';
      case 'warning':
        return '#FFF3E0';
      case 'info':
        return '#E8F5E9';
      default:
        return '#F5F7F6';
    }
  };

  const getTypeLabel = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'resolved') return alert.isResolved;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAsRead = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ));
  };

  const markAsResolved = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isResolved: true } : alert
    ));
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
  };

  return (
    <div className="alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-header-left">
          <h2>Alerts</h2>
          {unreadCount > 0 && (
            <span className="alerts-badge">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="alerts-mark-all" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheck} /> Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved
        </button>
      </div>

      {/* Alert List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="alerts-empty">
            <FontAwesomeIcon icon={faBell} />
            <p>No alerts found</p>
            <span>You're all caught up!</span>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item ${!alert.isRead ? 'unread' : ''} ${alert.isResolved ? 'resolved' : ''}`}
            >
              <div 
                className="alert-icon" 
                style={{ 
                  background: getSeverityBg(alert.severity),
                  color: getSeverityColor(alert.severity)
                }}
              >
                <FontAwesomeIcon icon={getSeverityIcon(alert.severity)} />
              </div>

              <div className="alert-content">
                <div className="alert-top">
                  <div className="alert-type">
                    <span className="alert-type-label">{getTypeLabel(alert.type)}</span>
                    {!alert.isRead && <span className="alert-dot"><FontAwesomeIcon icon={faCircle} /></span>}
                    {alert.isResolved && <span className="alert-resolved-badge">Resolved</span>}
                  </div>
                  <span className="alert-time">
                    <FontAwesomeIcon icon={faClock} /> {alert.time}
                  </span>
                </div>

                <h4 className="alert-title">{alert.title}</h4>
                <p className="alert-message">{alert.message}</p>
                
                {alert.product && (
                  <span className="alert-product">📦 {alert.product}</span>
                )}
              </div>

              <div className="alert-actions">
                {!alert.isRead && (
                  <button 
                    className="alert-read-btn"
                    onClick={() => markAsRead(alert.id)}
                    title="Mark as read"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
                {!alert.isResolved && (
                  <button 
                    className="alert-resolve-btn"
                    onClick={() => markAsResolved(alert.id)}
                    title="Resolve"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} />
                  </button>
                )}
                <button 
                  className="alert-delete-btn"
                  onClick={() => deleteAlert(alert.id)}
                  title="Delete"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}