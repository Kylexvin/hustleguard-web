import { useNavigate } from 'react-router-dom';
//import { useAuth } from '../hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCashRegister, 
  faBox, 
  faClock, 
  faChartBar,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import './css/Dashboard.css';

export default function Dashboard() {
  // const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { id: 1, title: 'New Sale', icon: faCashRegister, path: '/pos' },
    { id: 2, title: 'Add Stock', icon: faBox, path: '/products/add' },
    { id: 3, title: 'History', icon: faClock, path: '/sales' },
    { id: 4, title: 'Reports', icon: faChartBar, path: '/reports' },
  ];

  const stats = [
    { label: 'Revenue', value: 'KES 45.2K', change: '+12.5%', positive: true },
    { label: 'Sales', value: '23', change: '+8%', positive: true },
    { label: 'Low Stock', value: '7', change: '-2', positive: false },
  ];

  const activities = [
    { title: 'New sale: 3 items', time: '2 min ago', amount: '+KES 1,250' },
    { title: 'Stock updated: Rice', time: '15 min ago', amount: '+50 kg' },
    { title: 'Payment received', time: '1 hour ago', amount: '+KES 3,400' },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="header-top">


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
        {activities.map((item, i) => (
          <div className="activity-item" key={i}>
            <div className="activity-left">
              <div className="activity-dot"></div>
              <div>
                <div className="activity-title">{item.title}</div>
                <div className="activity-time">{item.time}</div>
              </div>
            </div>
            <div className={`activity-amount ${item.amount.startsWith('+') ? 'positive' : 'negative'}`}>
              {item.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}