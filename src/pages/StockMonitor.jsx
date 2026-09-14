// src/pages/StockMonitor.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, RefreshCw, Package, TrendingUp, 
  ClipboardCheck, CircleDollarSign, AlertCircle, ArrowRight
} from 'lucide-react';
import './css/StockMonitor.css';

// Render dash for null/undefined, otherwise the number
const fmtNum = (n) => (n === null || n === undefined ? '—' : n);


export default function StockMonitor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/stock-monitor/today');
      setData(response.data.data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="stock-monitor-loading">
        <div className="spinner"></div>
        <p>Loading stock data...</p>
      </div>
    );
  }

  const filteredProducts = data?.products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const hasDraft = data?.hasDraft;
  const hasBaseline = data?.summary?.hasBaseline;
  const summary = data?.summary;

  return (
    <div className="stock-monitor">
      {/* Header */}
      <div className="stock-monitor-header">
        <div>
          <h2>Stock Monitor</h2>
          <span className="date">
            {new Date(data?.date).toLocaleDateString('en-KE', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
            {data?.basedOn && <span className="based-on"> · {data.basedOn}</span>}
          </span>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="primary-btn" onClick={() => navigate('/stock-count')}>
            <ClipboardCheck size={18} />
            <span className="label">Start Stock Count</span>
          </button>
        </div>
      </div>

      {/* Draft banner */}
      {hasDraft && (
        <div className="draft-banner">
          <div className="draft-banner-left">
            <AlertCircle size={18} />
            <div>
              <strong>Stock count in progress</strong>
              <span>
                You have an unconfirmed count from{' '}
                {new Date(data.draftPeriod?.start).toLocaleDateString()} →{' '}
                {new Date(data.draftPeriod?.end).toLocaleDateString()}. Confirm it to update the monitor.
              </span>
            </div>
          </div>
          <button
            className="draft-resume-btn"
            onClick={() => navigate('/stock-count')}
          >
            Resume <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* No-baseline info banner */}
      {!hasBaseline && !hasDraft && (
        <div className="no-baseline-banner">
          <AlertCircle size={18} />
          <div>
            <strong>No confirmed stock count yet</strong>
            <span>
              Opening stock and sold quantities will appear after you confirm your first count.
              Current stock below is live and accurate.
            </span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="stock-summary">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="summary-label">Opening Stock</div>
            <div className="summary-value">
              {hasBaseline ? summary.totalOpeningStock : '—'}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#E3F2FD', color: '#1565C0' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="summary-label">Sold Today</div>
            <div className="summary-value">
              {hasBaseline ? summary.totalSoldToday : '—'}
            </div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#FFF3E0', color: '#E65100' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="summary-label">Current Stock</div>
            <div className="summary-value">{summary.totalCurrentStock || 0}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#F3E5F5', color: '#6A1B9A' }}>
            <CircleDollarSign size={20} />
          </div>
          <div>
            <div className="summary-label">POS / Unrecorded</div>
            <div className="summary-value">
              {summary.totalSoldPos || 0}
              <span className="muted"> / {hasBaseline ? summary.totalUnrecorded : '—'}</span>
            </div>
            <div className="summary-hint">recorded / missed</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="stock-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="stock-table-wrapper">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th className="text-right">Opening</th>
              <th className="text-right">Received</th>
              <th className="text-right">Sold</th>
              <th className="text-right">POS / Unrec.</th>
              <th className="text-right">Current</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <Package size={32} />
                  <p>No products found</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const stockLevel = product.currentStock / (product.minStockAlert || 5);
                let status = 'In Stock';
                let statusClass = 'in';
                if (product.currentStock === 0) {
                  status = 'Out of Stock';
                  statusClass = 'out';
                } else if (stockLevel <= 1) {
                  status = 'Low Stock';
                  statusClass = 'low';
                }

                return (
                  <tr key={product._id}>
                    <td className="product-name">{product.name}</td>
                    <td className="category">{product.category || '—'}</td>
                    <td className="text-right">
                      {fmtNum(product.openingStock)}
                    </td>
                    <td className="text-right">
                      {product.receivedToday > 0 ? `+${product.receivedToday}` : '0'}
                    </td>
                    <td className="text-right sold-today">
                      {fmtNum(product.soldToday)}
                    </td>
                    <td className="text-right pos-unrec">
                      <span className="pos">{product.soldTodayPos}</span>
                      <span className="sep">/</span>
                      <span className={product.unrecordedToday > 0 ? 'unrec' : 'unrec zero'}>
                        {fmtNum(product.unrecordedToday)}
                      </span>
                    </td>
                    <td className="text-right current-stock">{product.currentStock}</td>
                    <td className="text-right">
                      <span className={`status-badge ${statusClass}`}>{status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}