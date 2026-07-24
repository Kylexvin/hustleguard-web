// src/pages/Sales.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faDownload,
  faEye,
  faReceipt,
  faPrint,
  faSpinner,
  faArrowLeft,
  faArrowRight,
  faCalendarDay,
  faCalendarWeek,
  faCalendarAlt,
  faChartLine,
  faMoneyBillWave,
  faCoins,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import './css/Sales.css';

export default function Sales() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    today: { totalSales: 0, totalRevenue: 0, totalProfit: 0 },
    month: { totalSales: 0, totalRevenue: 0, totalProfit: 0 },
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/sales');
      const salesData = response.data.data || [];
      setSales(salesData);
      setTotalPages(Math.ceil(salesData.length / itemsPerPage));
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get('/sales/stats');
      // The API returns { success: true, data: { today: {...}, month: {...} } }
      const statsData = response.data.data || { today: { totalSales: 0, totalRevenue: 0, totalProfit: 0 }, month: { totalSales: 0, totalRevenue: 0, totalProfit: 0 }, topProducts: [] };
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
    fetchStats();
  }, [fetchSales, fetchStats]);

  // Filter sales based on search and period
  const getFilteredSales = () => {
    let filtered = [...sales];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.customer?.toLowerCase().includes(searchLower) ||
        sale._id?.toLowerCase().includes(searchLower) ||
        sale.product?.name?.toLowerCase().includes(searchLower)
      );
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterPeriod === 'today') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= today;
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= weekAgo;
      });
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= monthAgo;
      });
    }

    return filtered;
  };

  const filteredSales = getFilteredSales();

  // Pagination
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaymentLabel = (method) => {
    const labels = {
      cash: 'Cash',
      mobile_money: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      credit: 'Credit',
      card: 'Card'
    };
    return labels[method] || method || 'N/A';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/sales/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting sales:', err);
      alert('Failed to export sales data.');
    }
  };

  if (loading) {
    return (
      <div className="sales-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading sales data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-error">
        <p>{error}</p>
        <button onClick={() => { fetchSales(); fetchStats(); }} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sales-container">
      {/* Header */}
      <div className="sales-header">
        <div className="sales-header-left">
          <h2>Sales</h2>
          <span className="sales-count">{filteredSales.length} transactions</span>
        </div>
        <div className="sales-header-actions">
          <button className="sales-export-btn" onClick={handleExport}>
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          <button className="sales-new-btn" onClick={() => navigate('/sales/new')}>
            <FontAwesomeIcon icon={faShoppingCart} /> New Sale
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="sales-stats">
        <div className="sales-stat-card">
          <div className="sales-stat-icon sales-icon-sales">
            <FontAwesomeIcon icon={faReceipt} />
          </div>
          <div className="sales-stat-content">
            <span className="sales-stat-label">Today's Sales</span>
            <span className="sales-stat-value">
              {loadingStats ? '...' : stats.today?.totalSales || 0}
            </span>
          </div>
        </div>
        <div className="sales-stat-card">
          <div className="sales-stat-icon sales-icon-revenue">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="sales-stat-content">
            <span className="sales-stat-label">Today's Revenue</span>
            <span className="sales-stat-value">
              {loadingStats ? '...' : formatCurrency(stats.today?.totalRevenue || 0)}
            </span>
          </div>
        </div>
        <div className="sales-stat-card">
          <div className="sales-stat-icon sales-icon-profit">
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <div className="sales-stat-content">
            <span className="sales-stat-label">Today's Profit</span>
            <span className="sales-stat-value">
              {loadingStats ? '...' : formatCurrency(stats.today?.totalProfit || 0)}
            </span>
          </div>
        </div>
        <div className="sales-stat-card">
          <div className="sales-stat-icon sales-icon-month">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="sales-stat-content">
            <span className="sales-stat-label">Month's Revenue</span>
            <span className="sales-stat-value">
              {loadingStats ? '...' : formatCurrency(stats.month?.totalRevenue || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sales-toolbar">
        <div className="sales-search">
          <FontAwesomeIcon icon={faSearch} className="sales-search-icon" />
          <input
            type="text"
            placeholder="Search by customer, product, or invoice..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="sales-filter-group">
          <div className="sales-period-filter">
            <button
              className={`period-btn ${filterPeriod === 'today' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('today')}
            >
              <FontAwesomeIcon icon={faCalendarDay} /> Today
            </button>
            <button
              className={`period-btn ${filterPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('week')}
            >
              <FontAwesomeIcon icon={faCalendarWeek} /> Week
            </button>
            <button
              className={`period-btn ${filterPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setFilterPeriod('month')}
            >
              <FontAwesomeIcon icon={faCalendarAlt} /> Month
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="sales-table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Profit</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan="9" className="sales-empty">
                  <FontAwesomeIcon icon={faReceipt} />
                  <p>No sales found</p>
                  <span>Try adjusting your search or filter</span>
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td className="sales-invoice">#{sale._id?.slice(-6) || 'N/A'}</td>
                  <td>
                    <div className="sales-product-info">
                      <span className="product-name">{sale.product?.name || 'N/A'}</span>
                      <span className="product-category">{sale.product?.category || ''}</span>
                    </div>
                  </td>
                  <td>{sale.customer || 'Walk-in'}</td>
                  <td className="sales-quantity">{sale.quantity || 0}</td>
                  <td className="sales-amount">{formatCurrency(sale.sellingPrice * sale.quantity || 0)}</td>
                  <td className="sales-profit">{formatCurrency(sale.profit || 0)}</td>
                  <td>{getPaymentLabel(sale.paymentMethod)}</td>
                  <td className="sales-date">{formatDate(sale.saleDate)}</td>
                  <td>
                    <div className="sales-actions">
                      <button 
                        className="sales-action-btn view"
                        title="View Details"
                        onClick={() => navigate(`/sales/${sale._id}`)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="sales-action-btn print"
                        title="Print Receipt"
                        onClick={() => window.print()}
                      >
                        <FontAwesomeIcon icon={faPrint} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredSales.length > 0 && (
        <div className="sales-pagination">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} results
          </span>
          <div className="sales-pagination-buttons">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={currentPage === pageNum ? 'active' : ''}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}