// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag,
  Package,
  Clock,
  ChartBar,
  ArrowUp,
  ArrowDown,
  LoaderCircle,
  Store,
  Coins
} from 'lucide-react';
import './css/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    revenue: 'KES 0',
    sales: '0',
    lowStock: '0',
    profit: 'KES 0',
    inventoryValue: 'KES 0',
    weeklySales: 'KES 0',
    weeklyGrossProfit: 'KES 0'
  });
  const [statsChanges, setStatsChanges] = useState({
    revenue: { change: '+0%', positive: true },
    sales: { change: '+0%', positive: true },
    lowStock: { change: '0', positive: false },
    profit: { change: '+0%', positive: true },
    inventoryValue: { change: 'Current', positive: true },
    weeklySales: { change: 'This Week', positive: true },
    weeklyGrossProfit: { change: 'This Week', positive: true }
  });
  const [activities, setActivities] = useState([]);

  const quickActions = [
    { id: 1, title: 'New Sale', icon: ShoppingBag, path: '/pos' },
    { id: 2, title: 'Add Stock', icon: Package, path: '/products/add' },
    { id: 3, title: 'History', icon: Clock, path: '/sales' },
    { id: 4, title: 'Reports', icon: ChartBar, path: '/reports' },
  ];

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statsResponse = await axios.get('/sales/stats');
      const stats = statsResponse.data.data;

      const lowStockResponse = await axios.get('/products/low-stock');
      const lowStockData = lowStockResponse.data.data || [];

      const dashboardStatsResponse = await axios.get('/dashboard/stats');
      const dashboardStatsData = dashboardStatsResponse.data.data;

      const salesResponse = await axios.get('/sales?limit=10');
      const salesData = salesResponse.data.data || [];

      const todayRevenue = stats.today?.totalRevenue || 0;
      const todaySales = stats.today?.totalSales || 0;
      const todayProfit = stats.today?.totalProfit || 0;
      const monthRevenue = stats.month?.totalRevenue || 0;
      const monthSales = stats.month?.totalSales || 0;
      const monthProfit = stats.month?.totalProfit || 0;

      const yesterdayRevenue = monthRevenue - todayRevenue;
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;

      const yesterdaySales = monthSales - todaySales;
      const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0;

      const yesterdayProfit = monthProfit - todayProfit;
      const profitChange = yesterdayProfit > 0 ? ((todayProfit - yesterdayProfit) / yesterdayProfit * 100) : 0;

      setStatsData({
        revenue: `KES ${todayRevenue.toLocaleString()}`,
        sales: todaySales.toString(),
        lowStock: (dashboardStatsData.lowStockCount || lowStockData.length).toString(),
        profit: `KES ${todayProfit.toLocaleString()}`,
        inventoryValue: `KES ${(dashboardStatsData.inventoryValue || 0).toLocaleString()}`,
        weeklySales: `KES ${(dashboardStatsData.weeklySales || 0).toLocaleString()}`,
        weeklyGrossProfit: `KES ${(dashboardStatsData.weeklyGrossProfit || 0).toLocaleString()}`
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
          change: `${dashboardStatsData.lowStockCount || 0} items`, 
          positive: false 
        },
        profit: { 
          change: `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`, 
          positive: profitChange >= 0 
        },
        inventoryValue: { 
          change: 'Current', 
          positive: true 
        },
        weeklySales: { 
          change: 'This Week', 
          positive: true 
        },
        weeklyGrossProfit: { 
          change: 'This Week', 
          positive: true 
        }
      });

      // Build activities from recent sales
      const activitiesList = [];
      
      salesData.slice(0, 5).forEach(sale => {
        if (sale.items && sale.items.length > 0) {
          const firstItem = sale.items[0];
          const itemCount = sale.items.length;
          const productName = firstItem?.productName || 'Product';
          const quantity = firstItem?.quantity || 0;
          const unitLabel = firstItem?.unitSold?.label || '';
          
          activitiesList.push({
            title: `Sale: ${productName} x${quantity}${unitLabel ? ' ' + unitLabel : ''}${itemCount > 1 ? ` +${itemCount - 1} more` : ''}`,
            time: formatTime(sale.saleDate || sale.createdAt),
            amount: `+KES ${(sale.total || 0).toLocaleString()}`,
            type: 'sale',
            invoiceNumber: sale.invoiceNumber
          });
        } else {
          activitiesList.push({
            title: `Sale: ${sale.product?.name || 'Product'} x${sale.quantity || 0}`,
            time: formatTime(sale.createdAt || sale.saleDate),
            amount: `+KES ${((sale.sellingPrice || 0) * (sale.quantity || 0)).toLocaleString()}`,
            type: 'sale'
          });
        }
      });

      lowStockData.slice(0, 3).forEach(product => {
        const baseUnitLabel = product.baseUnit?.label || 'units';
        const stockAmount = product.totalStock || 0;
        activitiesList.push({
          title: `Low Stock: ${product.name}`,
          time: 'Now',
          amount: `${stockAmount} ${baseUnitLabel} left`,
          type: 'alert'
        });
      });

      if (dashboardStatsData.outOfStockCount > 0) {
        activitiesList.push({
          title: `${dashboardStatsData.outOfStockCount} products out of stock`,
          time: 'Now',
          amount: 'Restock needed',
          type: 'alert'
        });
      }

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

  // Main stats (4 cards)
  const mainStats = [
    { label: 'Revenue', value: statsData.revenue, change: statsChanges.revenue.change, positive: statsChanges.revenue.positive },
    { label: 'Sales', value: statsData.sales, change: statsChanges.sales.change, positive: statsChanges.sales.positive },
    { label: 'Low Stock', value: statsData.lowStock, change: statsChanges.lowStock.change, positive: statsChanges.lowStock.positive },
    { label: 'Profit', value: statsData.profit, change: statsChanges.profit.change, positive: statsChanges.profit.positive },
  ];

  // Summary stats (3 cards)
  const summaryStats = [
    { label: 'Inventory Value', value: statsData.inventoryValue, icon: Store },
    { label: 'Weekly Sales', value: statsData.weeklySales, icon: ChartBar },
    { label: 'Weekly Profit', value: statsData.weeklyGrossProfit, icon: Coins },
  ];

  if (loading) {
    return (
      <div className="dashboard">
        <div className="header">
          <div className="header-top">
            <div className="dashboard-title">Dashboard</div>
          </div>
          <div className="stats-row">
            {[1, 2, 3, 4].map((_, i) => (
              <div className="stat-card" key={i}>
                <div className="stat-header">
                  <div className="stat-icon">
                    <LoaderCircle className="spin" size={20} />
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
            <div className="dashboard-title">Dashboard</div>
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
        {/* Stats - Main 4 cards */}
        <div className="stats-row">
          {mainStats.map((stat, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-header">
                <div className="stat-icon">
                  {stat.positive ? (
                    <ArrowUp size={16} />
                  ) : (
                    <ArrowDown size={16} />
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

        {/* Summary Stats - 3 cards */}
        <div className="summary-stats-row">
          {summaryStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div className="summary-stat-item" key={i}>
                <div className="summary-stat-icon">
                  <Icon size={20} />
                </div>
                <div className="summary-stat-content">
                  <div className="summary-stat-value">{stat.value}</div>
                  <div className="summary-stat-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h3>Quick Actions</h3>
          <button className="see-all" onClick={() => navigate('/products')}>See All</button>
        </div>
        <div className="actions-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div 
                className="action-card" 
                key={action.id}
                onClick={() => navigate(action.path)}
              >
                <div className="action-icon">
                  <Icon size={24} />
                </div>
                <span>{action.title}</span>
              </div>
            );
          })}
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
            <div 
              className="activity-item" 
              key={i}
              onClick={() => {
                if (item.invoiceNumber) {
                  navigate(`/sales/${item.invoiceNumber}`);
                }
              }}
              style={{ cursor: item.invoiceNumber ? 'pointer' : 'default' }}
            >
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