// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCashRegister, 
  faBox, 
  faClock, 
  faChartBar,
  faArrowUp,
  faArrowDown,
  faSpinner,
  faBell,
  faStore,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import './css/Dashboard.css';

export default function Dashboard() {
  // const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    revenue: 'KES 0',
    sales: '0',
    lowStock: '0',
    profit: 'KES 0'
  });
  const [statsChanges, setStatsChanges] = useState({
    revenue: { change: '+0%', positive: true },
    sales: { change: '+0%', positive: true },
    lowStock: { change: '0', positive: false },
    profit: { change: '+0%', positive: true }
  });
  const [activities, setActivities] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [userName, setUserName] = useState('User');

  const quickActions = [
    { id: 1, title: 'New Sale', icon: faCashRegister, path: '/pos' },
    { id: 2, title: 'Add Stock', icon: faBox, path: '/products/add' },
    { id: 3, title: 'History', icon: faClock, path: '/sales' },
    { id: 4, title: 'Reports', icon: faChartBar, path: '/reports' },
  ];

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales stats
      const statsResponse = await axios.get('/sales/stats');
      const stats = statsResponse.data.data;

      // Fetch recent sales for activity
      const salesResponse = await axios.get('/sales');
      const salesData = salesResponse.data.data || [];

      // Fetch unread alerts count
      const alertsResponse = await axios.get('/alerts/unread/count');
      const unreadCount = alertsResponse.data.data?.unreadCount || 0;
      setUnreadAlerts(unreadCount);

      // Fetch low stock products
      const lowStockResponse = await axios.get('/products/low-stock');
      const lowStockData = lowStockResponse.data.data || [];

      // Calculate stats
      const todayRevenue = stats.today?.totalRevenue || 0;
      const monthRevenue = stats.month?.totalRevenue || 0;
      const todaySales = stats.today?.totalSales || 0;
      const monthSales = stats.month?.totalSales || 0;
      const todayProfit = stats.today?.totalProfit || 0;
      const monthProfit = stats.month?.totalProfit || 0;

      // Calculate changes
      const yesterdayRevenue = monthRevenue - todayRevenue;
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

      const yesterdaySales = monthSales - todaySales;
      const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0;

      const yesterdayProfit = monthProfit - todayProfit;
      const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit * 100) : 0;

      // Set stats values
      setStatsData({
        revenue: `KES ${todayRevenue.toLocaleString()}`,
        sales: todaySales.toString(),
        lowStock: lowStockData.length.toString(),
        profit: `KES ${todayProfit.toLocaleString()}`
      });

      setStatsChanges({
        revenue: { 
          change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`, 
          positive: revenueChange >= 0 
        },
        sales: { 
          change: `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}%`, 
          positive: salesChange >= 0 
        },
        lowStock: { 
          change: `${lowStockData.length} items`, 
          positive: false 
        },
        profit: { 
          change: `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`, 
          positive: profitChange >= 0 
        }
      });

      // Build activities from recent sales
      const recentSales = salesData.slice(0, 5);
      const activitiesList = recentSales.map(sale => ({
        title: `Sale: ${sale.product?.name || 'Product'} x${sale.quantity || 0}`,
        time: formatTime(sale.createdAt || sale.saleDate),
        amount: `+KES ${((sale.sellingPrice || 0) * (sale.quantity || 0)).toLocaleString()}`,
        type: 'sale'
      }));

      // Add low stock alerts to activities
      lowStockData.slice(0, 3).forEach(product => {
        activitiesList.push({
          title: `⚠️ Low Stock: ${product.name}`,
          time: 'Now',
          amount: `${product.quantity} left`,
          type: 'alert'
        });
      });

      // Sort activities
      activitiesList.sort((a, b) => {
        if (a.time === 'Now') return -1;
        if (b.time === 'Now') return 1;
        return 0;
      });

      setActivities(activitiesList.slice(0, 6));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
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
    return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short' });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Stats array for rendering
  const stats = [
    { label: 'Revenue', value: statsData.revenue, change: statsChanges.revenue.change, positive: statsChanges.revenue.positive },
    { label: 'Sales', value: statsData.sales, change: statsChanges.sales.change, positive: statsChanges.sales.positive },
    { label: 'Low Stock', value: statsData.lowStock, change: statsChanges.lowStock.change, positive: statsChanges.lowStock.positive },
    { label: 'Profit', value: statsData.profit, change: statsChanges.profit.change, positive: statsChanges.profit.positive },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="greeting">Loading...</div>
              <div className="user-name">Dashboard</div>
            </div>
          </div>
          <div className="stats-row">
            {[1, 2, 3, 4].map((_, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-header">
                  <div className="stat-icon">
                    <FontAwesomeIcon icon={faSpinner} spin />
                  </div>
                </div>
                <div className="stat-value">---</div>
                <div className="stat-label">Loading...</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="greeting">Error</div>
              <div className="user-name">Dashboard</div>
            </div>
          </div>
        </div>
        <div className="section" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: '#C0392B' }}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            style={{
              padding: '10px 24px',
              background: '#1B4D3D',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div>
            <div className="greeting">Welcome back,</div>
            <div className="user-name">{userName}</div>
            <div className="shop-info">
              <FontAwesomeIcon icon={faStore} className="shop-icon" />
              <span>My Store</span>
            </div>
          </div>
          <div className="notification-badge" onClick={() => navigate('/alerts')} style={{ cursor: 'pointer' }}>
            <FontAwesomeIcon icon={faBell} className="bell-icon" />
            {unreadAlerts > 0 && (
              <span className="badge">{unreadAlerts}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {stats.map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-header">
                <div className="stat-icon">
                  {stat.positive ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )}
                </div>
                <span className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h3>Quick Actions</h3>
          <button className="see-all" onClick={() => navigate('/products')}>See All</button>
        </div>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <div 
              className="action-card" 
              key={action.id}
              onClick={() => navigate(action.path)}
            >
              <div className="action-icon">
                <FontAwesomeIcon icon={action.icon} />
              </div>
              <span>{action.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <button className="see-all" onClick={() => navigate('/sales')}>View All</button>
        </div>
        {activities.length === 0 ? (
          <div className="activity-item" style={{ justifyContent: 'center' }}>
            <div className="activity-left" style={{ justifyContent: 'center' }}>
              <div>
                <div className="activity-title" style={{ textAlign: 'center', color: '#95A5A6' }}>
                  No recent activity
                </div>
              </div>
            </div>
          </div>
        ) : (
          activities.map((item, i) => (
            <div className="activity-item" key={i}>
              <div className="activity-left">
                <div className={`activity-dot ${item.type === 'alert' ? 'alert' : ''}`}></div>
                <div>
                  <div className="activity-title">{item.title}</div>
                  <div className="activity-time">{item.time}</div>
                </div>
              </div>
              <div className={`activity-amount ${item.amount.startsWith('+') ? 'positive' : 'negative'}`}>
                {item.amount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}