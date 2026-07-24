// src/pages/Alerts.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faCircleCheck, 
  faCircleXmark, 
  faTriangleExclamation,
  faClock,
  faCheck,
  faTrash,
  faCircle,
  faSpinner,
  faExclamationCircle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './css/Alerts.css';

export default function Alerts() {
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/alerts');
      const alertsData = response.data.data || [];
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get('/alerts/unread/count');
      setUnreadCount(response.data.data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [fetchAlerts, fetchUnreadCount]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return faCircleXmark;
      case 'warning': return faTriangleExclamation;
      case 'info': return faCircleCheck;
      default: return faBell;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'linear-gradient(135deg, #FEF2F2, #FEE2E2)';
      case 'warning': return 'linear-gradient(135deg, #FFFBEB, #FEF3C7)';
      case 'info': return 'linear-gradient(135deg, #ECFDF5, #D1FAE5)';
      default: return 'linear-gradient(135deg, #F3F4F6, #E5E7EB)';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock',
      dead_stock: 'Dead Stock',
      price_change: 'Price Change'
    };
    return labels[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'low_stock': return faExclamationCircle;
      case 'out_of_stock': return faCircleXmark;
      case 'dead_stock': return faTriangleExclamation;
      default: return faInfoCircle;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const markAsRead = async (id) => {
    try {
      setActionLoading(id);
      await axios.put(`/alerts/${id}/read`);
      
      setAlerts(alerts.map(alert => 
        alert._id === id ? { ...alert, isRead: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const markAsResolved = async (id) => {
    try {
      setActionLoading(id);
      await axios.put(`/alerts/${id}/resolve`);
      
      setAlerts(alerts.map(alert => 
        alert._id === id ? { ...alert, isResolved: true } : alert
      ));
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;

    try {
      setActionLoading(id);
      await axios.delete(`/alerts/${id}`);
      
      const updatedAlerts = alerts.filter(alert => alert._id !== id);
      setAlerts(updatedAlerts);
      
      const deletedAlert = alerts.find(alert => alert._id === id);
      if (deletedAlert && !deletedAlert.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadAlerts = alerts.filter(a => !a.isRead);
      for (const alert of unreadAlerts) {
        await axios.put(`/alerts/${alert._id}/read`);
      }
      
      setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'resolved') return alert.isResolved;
    return true;
  });

  if (loading && alerts.length === 0) {
    return (
      <div className="alerts-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading alerts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-error">
        <p>{error}</p>
        <button onClick={() => { fetchAlerts(); fetchUnreadCount(); }} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <div className="alerts-header-left">
          <h2>🔔 Alerts</h2>
          {unreadCount > 0 && (
            <span className="alerts-badge">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="alerts-mark-all" onClick={markAllAsRead}>
            <FontAwesomeIcon icon={faCheck} /> <span>Mark all read</span>
          </button>
        )}
      </div>

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
          Resolved ({alerts.filter(a => a.isResolved).length})
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="alerts-empty">
            <FontAwesomeIcon icon={faBell} />
            <p>All clear!</p>
            <span>No alerts to display</span>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert._id} 
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
                    <FontAwesomeIcon icon={getTypeIcon(alert.type)} className="alert-type-icon" />
                    <span className="alert-type-label">{getTypeLabel(alert.type)}</span>
                    {!alert.isRead && <span className="alert-dot"><FontAwesomeIcon icon={faCircle} /></span>}
                    {alert.isResolved && <span className="alert-resolved-badge">✓ Resolved</span>}
                  </div>
                  <span className="alert-time">
                    <FontAwesomeIcon icon={faClock} /> {formatDate(alert.createdAt)}
                  </span>
                </div>

                <h4 className="alert-title">{alert.title}</h4>
                <p className="alert-message">{alert.message}</p>
                
                {alert.productName && (
                  <span className="alert-product">📦 {alert.productName}</span>
                )}
              </div>

              <div className="alert-actions">
                {!alert.isRead && (
                  <button 
                    className="alert-read-btn"
                    onClick={() => markAsRead(alert._id)}
                    disabled={actionLoading === alert._id}
                    title="Mark as read"
                  >
                    {actionLoading === alert._id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faCheck} />
                    )}
                  </button>
                )}
                {!alert.isResolved && (
                  <button 
                    className="alert-resolve-btn"
                    onClick={() => markAsResolved(alert._id)}
                    disabled={actionLoading === alert._id}
                    title="Resolve"
                  >
                    {actionLoading === alert._id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faCircleCheck} />
                    )}
                  </button>
                )}
                <button 
                  className="alert-delete-btn"
                  onClick={() => deleteAlert(alert._id)}
                  disabled={actionLoading === alert._id}
                  title="Delete"
                >
                  {actionLoading === alert._id ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}