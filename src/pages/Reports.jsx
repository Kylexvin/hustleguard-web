import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faBoxes, 
  faCoins, 
  faMoneyBillWave,
  faClipboardCheck,
  faArrowTrendUp,
  faDownload,
  faEye,
  faSpinner,
  faCalendarAlt,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './css/Reports.css';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const stockRes = await axios.get('/reports/stock/value');
      const reportsRes = await axios.get('/reports/stock/weekly', {
        params: { limit: 5 }
      });
      
      setSummary(stockRes.data.data || {});
      setRecentReports(reportsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportCards = [
    {
      id: 'stock',
      title: 'Stock Report',
      icon: faBoxes,
      color: '#2E7D32',
      bgColor: '#E8F5E9',
      description: 'Opening stock, sales, closing stock & variances',
      path: '/reports/stock'
    },
    {
      id: 'profit',
      title: 'Profit & Loss',
      icon: faChartLine,
      color: '#1565C0',
      bgColor: '#E3F2FD',
      description: 'Sales → COGS → Gross Profit → Expenses → Net Profit',
      path: '/reports/profit'
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: faMoneyBillWave,
      color: '#E65100',
      bgColor: '#FFF3E0',
      description: 'Track all business expenses by category',
      path: '/reports/expenses'
    },
    {
      id: 'physical',
      title: 'Physical Count',
      icon: faClipboardCheck,
      color: '#6A1B9A',
      bgColor: '#F3E5F5',
      description: 'System stock vs physically counted stock',
      path: '/reports/physical-count'
    },
    {
      id: 'trends',
      title: 'Trends',
      icon:  faArrowTrendUp,
      color: '#00838F',
      bgColor: '#E0F7FA',
      description: 'Weekly/monthly sales and profit trends',
      path: '/reports/trends'
    }
  ];

  if (loading) {
    return (
      <div className="reports-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <h2>Reports & Analytics</h2>
        <button className="reports-download-btn" onClick={fetchDashboardData}>
          <FontAwesomeIcon icon={faDownload} /> Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="reports-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Stock Value</span>
            <span className="stat-value">KES {summary?.totalStockValue?.toLocaleString() || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
            <FontAwesomeIcon icon={faBoxes} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{summary?.totalItems || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Reports Generated</span>
            <span className="stat-value">{recentReports.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#F3E5F5', color: '#6A1B9A' }}>
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Value/Item</span>
            <span className="stat-value">KES {summary?.averageValuePerItem?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="reports-grid">
        {reportCards.map((card) => (
          <div 
            key={card.id}
            className="report-card"
            onClick={() => navigate(card.path)}
          >
            <div className="report-card-icon" style={{ backgroundColor: card.bgColor, color: card.color }}>
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <div className="report-card-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <div className="report-card-arrow">
              <FontAwesomeIcon icon={faChevronRight} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <div className="recent-reports">
          <h3>Recent Reports</h3>
          <div className="recent-reports-list">
            {recentReports.map((report) => (
              <div 
                key={report._id} 
                className="recent-report-item"
                onClick={() => navigate(`/reports/stock/${report._id}`)}
              >
                <div className="recent-report-info">
                  <span className="recent-report-week">
                    Week {report.weekNumber}, {report.year}
                  </span>
                  <span className="recent-report-date">
                    {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="recent-report-status">
                  <span className={`status-badge ${report.status}`}>
                    {report.status}
                  </span>
                  <span className="recent-report-items">
                    {report.items?.length || 0} items
                  </span>
                </div>
                <button className="view-report-btn">
                  <FontAwesomeIcon icon={faEye} /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}