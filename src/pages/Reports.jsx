// src/pages/Reports.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faBoxes, 
  faCoins, 
  faMoneyBillWave,
  faArrowTrendUp,
  faDownload,

  faSpinner,
 
  faChevronRight,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';
import './css/Reports.css';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsRes = await axios.get('/dashboard/stats');
      const statsData = statsRes.data.data || {};
      
      // Fetch expense summary
      const expenseRes = await axios.get('/expenses/summary');
      const expenseData = expenseRes.data.data || {};
      
      setSummary({
        inventoryValue: statsData.inventoryValue || 0,
        totalProducts: statsData.totalProducts || 0,
        totalExpenses: expenseData.summary?.totalAmount || 0,
        expenseCount: expenseData.summary?.count || 0,
        weeklySales: statsData.weeklySales || 0,
        weeklyProfit: statsData.weeklyGrossProfit || 0,
        monthlySales: statsData.monthlySales || 0,
        monthlyProfit: statsData.monthlyProfit || 0,
        lowStockCount: statsData.lowStockCount || 0,
        outOfStockCount: statsData.outOfStockCount || 0
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      setSummary({
        inventoryValue: 0,
        totalProducts: 0,
        totalExpenses: 0,
        expenseCount: 0,
        weeklySales: 0,
        weeklyProfit: 0,
        monthlySales: 0,
        monthlyProfit: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      });
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
      description: 'View current stock levels, low stock alerts, and inventory value',
      path: '/products'
    },
    {
      id: 'profit',
      title: 'Profit & Loss',
      icon: faChartLine,
      color: '#1565C0',
      bgColor: '#E3F2FD',
      description: 'Sales revenue, costs, and profit analysis',
      path: '/sales'
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: faMoneyBillWave,
      color: '#E65100',
      bgColor: '#FFF3E0',
      description: 'Track all business expenses by category',
      path: '/expenses'
    },
    {
      id: 'trends',
      title: 'Trends',
      icon: faArrowTrendUp,
      color: '#00838F',
      bgColor: '#E0F7FA',
      description: 'Weekly and monthly sales, revenue, and profit trends',
      path: '/sales'
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

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

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
            <span className="stat-label">Inventory Value</span>
            <span className="stat-value">{formatCurrency(summary?.inventoryValue || 0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Weekly Sales</span>
            <span className="stat-value">{formatCurrency(summary?.weeklySales || 0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
            <FontAwesomeIcon icon={faReceipt} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Monthly Sales</span>
            <span className="stat-value">{formatCurrency(summary?.monthlySales || 0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E0F7FA', color: '#00838F' }}>
            <FontAwesomeIcon icon={faBoxes} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value">{summary?.lowStockCount || 0}</span>
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
    </div>
  );
}