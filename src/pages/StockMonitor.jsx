// src/pages/StockMonitor.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Package, TrendingUp, TrendingDown } from 'lucide-react';
import './css/StockMonitor.css';

export default function StockMonitor() {
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
    // Auto-refresh every 60 seconds
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

  return (
    <div className="stock-monitor">
      {/* Header */}
      <div className="stock-monitor-header">
        <div>
          <h2>Stock Monitor</h2>
          <span className="date">{new Date(data?.date).toLocaleDateString('en-KE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <button className="refresh-btn" onClick={refresh} disabled={refreshing}>
          <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="stock-summary">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="summary-label">Opening Stock</div>
            <div className="summary-value">{data?.summary?.totalOpeningStock || 0}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#E3F2FD', color: '#1565C0' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="summary-label">Sold Today</div>
            <div className="summary-value">{data?.summary?.totalSoldToday || 0}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#FFF3E0', color: '#E65100' }}>
            <Package size={20} />
          </div>
          <div>
            <div className="summary-label">Current Stock</div>
            <div className="summary-value">{data?.summary?.totalCurrentStock || 0}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#F3E5F5', color: '#6A1B9A' }}>
            <TrendingDown size={20} />
          </div>
          <div>
            <div className="summary-label">Products with Sales</div>
            <div className="summary-value">{data?.summary?.productsWithSales || 0}</div>
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
              <th className="text-right">Opening Stock</th>
              <th className="text-right">Sold Today</th>
              <th className="text-right">Current Stock</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <Package size={32} />
                  <p>No products found</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const stockLevel = product.currentStock / product.minStockAlert;
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
                    <td className="text-right">{product.openingStock}</td>
                    <td className="text-right sold-today">{product.soldToday > 0 ? `+${product.soldToday}` : '0'}</td>
                    <td className="text-right current-stock">{product.currentStock}</td>
                    <td className="text-right">
                      <span className={`status-badge ${statusClass}`}>
                        {status}
                      </span>
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