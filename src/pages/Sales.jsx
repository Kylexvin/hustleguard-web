// src/pages/Sales.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faDownload,
  faEye,
  faReceipt,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import './css/Sales.css';

export default function Sales() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('today');

  // Sample sales data - replace with API data
  const [sales] = useState([
    { 
      id: 1, 
      invoice: 'INV-001', 
      customer: 'John Customer', 
      items: 3, 
      total: 1250, 
      profit: 320,
      payment: 'cash', 
      status: 'completed', 
      date: '2024-07-14 10:30 AM' 
    },
    { 
      id: 2, 
      invoice: 'INV-002', 
      customer: 'Mary Buyer', 
      items: 2, 
      total: 750, 
      profit: 180,
      payment: 'mobile_money', 
      status: 'completed', 
      date: '2024-07-14 09:15 AM' 
    },
    { 
      id: 3, 
      invoice: 'INV-003', 
      customer: 'Peter Shopper', 
      items: 5, 
      total: 2300, 
      profit: 550,
      payment: 'cash', 
      status: 'pending', 
      date: '2024-07-13 04:45 PM' 
    },
    { 
      id: 4, 
      invoice: 'INV-004', 
      customer: 'Jane Client', 
      items: 1, 
      total: 600, 
      profit: 120,
      payment: 'bank_transfer', 
      status: 'completed', 
      date: '2024-07-13 02:20 PM' 
    },
    { 
      id: 5, 
      invoice: 'INV-005', 
      customer: 'James Buyer', 
      items: 4, 
      total: 1850, 
      profit: 420,
      payment: 'mobile_money', 
      status: 'cancelled', 
      date: '2024-07-12 11:00 AM' 
    },
    { 
      id: 6, 
      invoice: 'INV-006', 
      customer: 'Sarah Store', 
      items: 2, 
      total: 450, 
      profit: 95,
      payment: 'cash', 
      status: 'completed', 
      date: '2024-07-12 09:30 AM' 
    },
  ]);

  const periods = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Custom', value: 'custom' },
  ];

  const getPaymentLabel = (method) => {
    const labels = {
      cash: 'Cash',
      mobile_money: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      credit: 'Credit'
    };
    return labels[method] || method;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.customer.toLowerCase().includes(search.toLowerCase()) ||
    sale.invoice.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div className="sales-container">
      {/* Header */}
      <div className="sales-header">
        <h2>Sales</h2>
        <button className="sales-export-btn">
          <FontAwesomeIcon icon={faDownload} /> Export
        </button>
      </div>

      {/* Stats Summary */}
      <div className="sales-stats">
        <div className="sales-stat-card">
          <span className="sales-stat-label">Total Sales</span>
          <span className="sales-stat-value">{filteredSales.length}</span>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-label">Revenue</span>
          <span className="sales-stat-value">KES {totalRevenue.toLocaleString()}</span>
        </div>
        <div className="sales-stat-card">
          <span className="sales-stat-label">Profit</span>
          <span className="sales-stat-value">KES {totalProfit.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="sales-toolbar">
        <div className="sales-search">
          <FontAwesomeIcon icon={faSearch} className="sales-search-icon" />
          <input
            type="text"
            placeholder="Search by customer or invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sales-filter-group">
          <div className="sales-period-filter">
            {periods.map((period) => (
              <button
                key={period.value}
                className={`period-btn ${filterPeriod === period.value ? 'active' : ''}`}
                onClick={() => setFilterPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="sales-table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="8" className="sales-empty">
                  <FontAwesomeIcon icon={faReceipt} />
                  <p>No sales found</p>
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="sales-invoice">{sale.invoice}</td>
                  <td>{sale.customer}</td>
                  <td>{sale.items}</td>
                  <td className="sales-amount">KES {sale.total.toLocaleString()}</td>
                  <td>{getPaymentLabel(sale.payment)}</td>
                  <td>
                    <span className={`sales-status ${getStatusColor(sale.status)}`}>
                      {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                    </span>
                  </td>
                  <td className="sales-date">{sale.date}</td>
                  <td>
                    <div className="sales-actions">
                      <button 
                        className="sales-action-btn view"
                        title="View Details"
                        onClick={() => navigate(`/sales/${sale.id}`)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="sales-action-btn print"
                        title="Print Receipt"
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

      {/* Pagination - Dummy */}
      <div className="sales-pagination">
        <span>Showing 1-{Math.min(filteredSales.length, 10)} of {filteredSales.length} results</span>
        <div className="sales-pagination-buttons">
          <button disabled>Previous</button>
          <button className="active">1</button>
          <button>2</button>
          <button>3</button>
          <button>Next</button>
        </div>
      </div>
    </div>
  );
}