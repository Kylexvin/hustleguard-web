import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faDownload, 
  faArrowLeft,
  faPlus,
  faTrash,
  faPencilAlt,
  faClipboardCheck,
  faFileExport,
  faSearch,
  faFilter,
  faTimes,
  faSave,
  faCalendarAlt,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faMinusCircle,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import '../css/PhysicalCountReport.css';

export default function PhysicalCountReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [productsNeedingCount, setProductsNeedingCount] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariance, setSelectedVariance] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    unitName: '',
    physicalQuantity: '',
    countedBy: '',
    notes: ''
  });

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchCounts();
      fetchSummary();
      fetchProductsNeedingCount();
    }
  }, [startDate, endDate]);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/reports/physical-counts', {
        params: { startDate, endDate, limit: 100 }
      });
      setCounts(response.data.data?.counts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load physical counts');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/reports/physical-counts/variance-summary', {
        params: { startDate, endDate }
      });
      setSummary(response.data.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const fetchProductsNeedingCount = async () => {
    try {
      const response = await axios.get('/reports/physical-counts/needing-count');
      setProductsNeedingCount(response.data.data || []);
    } catch (err) {
      console.error('Failed to load products needing count:', err);
    }
  };

  const handleAddCount = async () => {
    try {
      await axios.post('/reports/physical-counts', {
        ...formData,
        physicalQuantity: parseFloat(formData.physicalQuantity),
        countedBy: formData.countedBy || 'System'
      });
      setShowAddModal(false);
      resetForm();
      fetchCounts();
      fetchSummary();
      fetchProductsNeedingCount();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record physical count');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      productName: '',
      unitName: '',
      physicalQuantity: '',
      countedBy: '',
      notes: ''
    });
    setSelectedProduct(null);
  };

  const formatCurrency = (amount) => `KES ${(amount || 0).toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  const getVarianceType = (variance) => {
    if (variance > 0) return { label: 'Over', icon: faCheckCircle, color: '#10b981', class: 'over' };
    if (variance < 0) return { label: 'Under', icon: faTimesCircle, color: '#ef4444', class: 'under' };
    return { label: 'Match', icon: faMinusCircle, color: '#6b7280', class: 'match' };
  };

  const filteredCounts = counts.filter(count => {
    const matchesSearch = count.productName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVariance = selectedVariance === 'all' || 
      (selectedVariance === 'over' && count.variance > 0) ||
      (selectedVariance === 'under' && count.variance < 0) ||
      (selectedVariance === 'match' && count.variance === 0);
    return matchesSearch && matchesVariance;
  });

  if (loading) {
    return (
      <div className="physical-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading physical counts...</p>
      </div>
    );
  }

  return (
    <div className="physical-container">
      {/* Header */}
      <div className="physical-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/reports')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h2>Physical Count</h2>
            <p>System stock vs physically counted stock</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}>
            <FontAwesomeIcon icon={faPlus} /> Record Count
          </button>
          <button className="btn-outline">
            <FontAwesomeIcon icon={faFileExport} /> Export
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="physical-date-range">
        <div className="date-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="date-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => { fetchCounts(); fetchSummary(); }}>
          <FontAwesomeIcon icon={faDownload} /> Update
        </button>
      </div>

      {error && (
        <div className="physical-error">
          <p>{error}</p>
          <button onClick={fetchCounts} className="btn-primary">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="physical-summary-cards">
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Over Stock</span>
              <span className="summary-value" style={{ color: '#10b981' }}>
                {formatCurrency(summary.totalOverVariance)}
              </span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <FontAwesomeIcon icon={faTimesCircle} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Under Stock</span>
              <span className="summary-value" style={{ color: '#ef4444' }}>
                {formatCurrency(Math.abs(summary.totalUnderVariance || 0))}
              </span>
            </div>
          </div>
          <div className="summary-card highlight">
            <div className="summary-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Net Variance</span>
              <span className="summary-value" style={{ color: summary.netVariance > 0 ? '#10b981' : summary.netVariance < 0 ? '#ef4444' : '#6b7280' }}>
                {formatCurrency(summary.netVariance || 0)}
              </span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Counts Performed</span>
              <span className="summary-value">{summary.count || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Products Needing Count */}
      {productsNeedingCount.length > 0 && (
        <div className="needing-count">
          <h3>
            <FontAwesomeIcon icon={faExclamationTriangle} /> 
            Products Needing Physical Count
          </h3>
          <div className="needing-list">
            {productsNeedingCount.filter(p => p.needsCount).slice(0, 5).map((product) => (
              <div key={product.productId} className="needing-item">
                <span className="needing-name">{product.productName}</span>
                <span className="needing-category">{product.category}</span>
                <span className="needing-days">
                  {product.daysSinceLastCount ? `${product.daysSinceLastCount} days ago` : 'Never counted'}
                </span>
                <button 
                  className="btn-primary small"
                  onClick={() => {
                    setFormData({
                      productId: product.productId,
                      productName: product.productName,
                      unitName: '',
                      physicalQuantity: '',
                      countedBy: '',
                      notes: ''
                    });
                    setShowAddModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} /> Count Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="physical-toolbar">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
        <div className="filter-box">
          <FontAwesomeIcon icon={faFilter} />
          <select value={selectedVariance} onChange={(e) => setSelectedVariance(e.target.value)}>
            <option value="all">All Variances</option>
            <option value="over">Over Stock</option>
            <option value="under">Under Stock</option>
            <option value="match">Match</option>
          </select>
        </div>
        <div className="total-display">
          Total: <strong>{filteredCounts.length} counts</strong>
        </div>
      </div>

      {/* Counts Table */}
      <div className="physical-table-container">
        {filteredCounts.length === 0 ? (
          <div className="physical-empty">
            <FontAwesomeIcon icon={faClipboardCheck} />
            <p>No physical counts recorded</p>
            <button className="btn-primary" onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}>
              Record your first count
            </button>
          </div>
        ) : (
          <table className="physical-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th className="num">System</th>
                <th className="num">Physical</th>
                <th className="num">Variance</th>
                <th>Status</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCounts.map((count) => {
                const variance = getVarianceType(count.variance);
                return (
                  <tr key={count._id} className={variance.class}>
                    <td>{formatDate(count.countDate)}</td>
                    <td>
                      <div className="product-cell">
                        <span className="product-name">{count.productName}</span>
                        <span className="product-unit">{count.unit?.label || 'Unit'}</span>
                      </div>
                    </td>
                    <td className="num">{Math.round(count.systemQuantity * 100) / 100}</td>
                    <td className="num strong">{Math.round(count.physicalQuantity * 100) / 100}</td>
                    <td className={`num ${variance.class}`}>
                      {count.variance > 0 ? '+' : ''}{Math.round(count.variance * 100) / 100}
                    </td>
                    <td>
                      <span className={`variance-badge ${variance.class}`}>
                        <FontAwesomeIcon icon={variance.icon} /> {variance.label}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="action-btn view" title="View Details">
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Physical Count</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Product *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => {
                    const product = productsNeedingCount.find(p => p.productId === e.target.value);
                    setFormData({
                      ...formData,
                      productId: e.target.value,
                      productName: product?.productName || ''
                    });
                  }}
                >
                  <option value="">Select a product</option>
                  {productsNeedingCount.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Product Name</label>
                <input type="text" value={formData.productName} disabled />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  placeholder="e.g., Units, kg, pieces"
                  value={formData.unitName}
                  onChange={(e) => setFormData({...formData, unitName: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Physical Quantity *</label>
                <input
                  type="number"
                  placeholder="Enter counted quantity"
                  value={formData.physicalQuantity}
                  onChange={(e) => setFormData({...formData, physicalQuantity: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Counted By</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={formData.countedBy}
                    onChange={(e) => setFormData({...formData, countedBy: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    disabled
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddCount} disabled={!formData.productId || !formData.physicalQuantity}>
                <FontAwesomeIcon icon={faSave} /> Record Count
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}