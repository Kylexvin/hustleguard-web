// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ShoppingBag,
  Package,
  Clock,
  ChartBar,

  Coins,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import './css/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    inventoryValue: 0,
    weekly: {
      pos:    { sales: 0, profit: 0 },
      offPos: { sales: 0, profit: 0 },
      total:  { sales: 0, profit: 0 }
    }
  });
  const [activities, setActivities] = useState([]);

  const quickActions = [
    { id: 1, title: 'New Sale',  icon: ShoppingBag, path: '/pos' },
    { id: 2, title: 'Add Stock', icon: Package,     path: '/products/add' },
    { id: 3, title: 'History',   icon: Clock,       path: '/sales' },
    { id: 4, title: 'Reports',   icon: ChartBar,    path: '/reports' },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [lowStockRes, statsRes, salesRes] = await Promise.all([
        axios.get('/products/low-stock'),
        axios.get('/dashboard/stats'),
        axios.get('/sales?limit=10')
      ]);

      const lowStockData = lowStockRes.data.data || [];
      const dashboardStatsData = statsRes.data.data || {};
      const salesData = salesRes.data.data || [];

      const toNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const weekly = dashboardStatsData.weekly || {};

      setStatsData({
        inventoryValue: toNum(dashboardStatsData.inventoryValue),
        weekly: {
          pos: {
            sales:  toNum(weekly.pos?.sales),
            profit: toNum(weekly.pos?.profit)
          },
          offPos: {
            sales:  toNum(weekly.offPos?.sales),
            profit: toNum(weekly.offPos?.profit)
          },
          total: {
            sales:  toNum(weekly.total?.sales),
            profit: toNum(weekly.total?.profit)
          }
        }
      });

      // --- Build activity feed ---
      const activitiesList = [];

      salesData.slice(0, 5).forEach(sale => {
        if (sale.items && sale.items.length > 0) {
          const firstItem = sale.items[0];
          const itemCount = sale.items.length;
          const productName = firstItem?.productName || 'Product';
          const quantity = firstItem?.quantity || 0;
          const unitLabel = firstItem?.unit?.label || '';

          activitiesList.push({
            title: `Sale: ${productName} x${quantity}${unitLabel ? ' ' + unitLabel : ''}${itemCount > 1 ? ` +${itemCount - 1} more` : ''}`,
            time: formatTime(sale.saleDate || sale.createdAt),
            amount: `+KES ${toNum(sale.total).toLocaleString()}`,
            type: 'sale',
            invoiceNumber: sale.invoiceNumber
          });
        }
      });

      lowStockData.slice(0, 3).forEach(product => {
        const baseUnit = product.units?.find(u => u.isBase === true);
        const baseUnitLabel = baseUnit?.label || 'units';
        const stockAmount = product.stock || 0;
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
        if (a.time === 'Now' && b.time !== 'Now') return -1;
        if (b.time === 'Now' && a.time !== 'Now') return 1;
        return 0;
      });

      setActivities(activitiesList.slice(0, 6));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
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

  const formatKES = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ============================================================
  // LOADING SKELETON
  // ============================================================
  if (loading) {
    return (
      <div className="dashboard">
        {/* Hero card skeleton */}
        <div className="header">
          <div className="hero-card">
            <div className="hero-card-label skeleton skeleton-text sm skeleton-w-40" />
            <div className="hero-card-value">
              <div className="skeleton skeleton-text lg skeleton-w-60" />
            </div>
            <div className="hero-card-sub skeleton skeleton-text sm skeleton-w-50" />
          </div>
        </div>

        {/* Sales row skeleton */}
        <div className="section" style={{ paddingTop: 12 }}>
          <div className="skeleton skeleton-text sm skeleton-w-40" style={{ marginBottom: 10 }} />
          <div className="summary-stats-row summary-stats-row--three">
            {[1, 2, 3].map((_, i) => (
              <div className="summary-stat-item is-loading" key={i}>
                <div className="summary-stat-icon skeleton skeleton-icon" />
                <div className="summary-stat-content">
                  <div className="skeleton skeleton-text lg skeleton-w-70" />
                  <div className="skeleton skeleton-text sm skeleton-w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profit row skeleton */}
        <div className="section" style={{ paddingTop: 12 }}>
          <div className="skeleton skeleton-text sm skeleton-w-40" style={{ marginBottom: 10 }} />
          <div className="summary-stats-row summary-stats-row--three">
            {[1, 2, 3].map((_, i) => (
              <div className="summary-stat-item is-loading" key={i}>
                <div className="summary-stat-icon skeleton skeleton-icon" />
                <div className="summary-stat-content">
                  <div className="skeleton skeleton-text lg skeleton-w-70" />
                  <div className="skeleton skeleton-text sm skeleton-w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions skeleton */}
        <div className="section">
          <div className="section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="actions-grid">
            {[1, 2, 3, 4].map((_, i) => (
              <div className="action-card is-loading" key={i}>
                <div className="action-icon skeleton skeleton-icon" />
                <div
                  className="skeleton skeleton-text sm skeleton-w-60"
                  style={{ margin: '0 auto' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity skeleton */}
        <div className="section">
          <div className="section-header">
            <h3>Recent Activity</h3>
          </div>
          {[1, 2, 3, 4].map((_, i) => (
            <div className="activity-item is-loading" key={i}>
              <div className="activity-left">
                <div
                  className="activity-dot skeleton skeleton-icon"
                  style={{ borderRadius: '50%' }}
                />
                <div className="activity-skeleton-lines">
                  <div className="skeleton skeleton-text skeleton-w-70" />
                  <div className="skeleton skeleton-text sm skeleton-w-40" />
                </div>
              </div>
              <div
                className="skeleton skeleton-text skeleton-w-60"
                style={{ width: '60px' }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div className="dashboard">
        <div className="section error-state">
          <AlertTriangle size={48} color="#C0392B" />
          <p>{error}</p>
          <button className="error-retry-btn" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN DASHBOARD
  // ============================================================
  return (
    <div className="dashboard">

      {/* === Inventory Value — hero card === */}
      <div className="header">
        <div className="hero-card">
          <div className="hero-card-label">Inventory Value</div>
          <div className="hero-card-value">{formatKES(statsData.inventoryValue)}</div>
          <div className="hero-card-sub">Current stock valuation</div>
        </div>
      </div>

      {/* === This Week — Sales === */}
      <div className="section" style={{ paddingTop: 12 }}>
        <div className="summary-group-label">This Week — Sales</div>
        <div className="summary-stats-row summary-stats-row--three">
          <div className="summary-stat-item">
            <div className="summary-stat-icon"><ChartBar size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.pos.sales)}</div>
              <div className="summary-stat-label">POS Sales</div>
            </div>
          </div>
          <div className="summary-stat-item">
            <div className="summary-stat-icon"><ShoppingBag size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.offPos.sales)}</div>
              <div className="summary-stat-label">Off-POS Sales</div>
            </div>
          </div>
          <div className="summary-stat-item summary-stat-item--total">
            <div className="summary-stat-icon"><TrendingUp size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.total.sales)}</div>
              <div className="summary-stat-label">Total Sales</div>
            </div>
          </div>
        </div>
      </div>

      {/* === This Week — Profit === */}
      <div className="section" style={{ paddingTop: 12 }}>
        <div className="summary-group-label">This Week — Profit</div>
        <div className="summary-stats-row summary-stats-row--three">
          <div className="summary-stat-item">
            <div className="summary-stat-icon"><Coins size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.pos.profit)}</div>
              <div className="summary-stat-label">POS Profit</div>
            </div>
          </div>
          <div className="summary-stat-item">
            <div className="summary-stat-icon"><Coins size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.offPos.profit)}</div>
              <div className="summary-stat-label">Off-POS Profit</div>
            </div>
          </div>
          <div className="summary-stat-item summary-stat-item--total">
            <div className="summary-stat-icon"><TrendingUp size={16} /></div>
            <div className="summary-stat-content">
              <div className="summary-stat-value">{formatKES(statsData.weekly.total.profit)}</div>
              <div className="summary-stat-label">Total Profit</div>
            </div>
          </div>
        </div>
      </div>

      {/* === Quick Actions === */}
      <div className="section">
        <div className="section-header">
          <h3>Quick Actions</h3>
          <button className="see-all" onClick={() => navigate('/products')}>
            See All
          </button>
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
                  <Icon size={22} />
                </div>
                <span>{action.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* === Recent Activity === */}
      <div className="section">
        <div className="section-header">
          <h3>Recent Activity</h3>
          <button className="see-all" onClick={() => navigate('/sales')}>
            View All
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="activity-item" style={{ justifyContent: 'center' }}>
            <div className="activity-left" style={{ justifyContent: 'center' }}>
              <div>
                <div
                  className="activity-title"
                  style={{ textAlign: 'center', color: '#95A5A6' }}
                >
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
              <div
                className={`activity-amount ${item.amount.startsWith('+') ? 'positive' : 'negative'}`}
              >
                {item.amount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}