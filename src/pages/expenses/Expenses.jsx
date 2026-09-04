// src/pages/expenses/Expenses.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faEdit, 
  faTrash, 
  faTimes,
  faSpinner,
  faMoneyBillWave,
  faCalendarAlt,
  faFilter,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './css/Expenses.css';

export default function Expenses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  const expenseCategories = [
    'rent', 'utilities', 'salaries', 'transport',
    'supplies', 'marketing', 'maintenance', 'tax',
    'insurance', 'licenses', 'equipment', 'other'
  ];

  const categoryLabels = {
    rent: 'Rent',
    utilities: 'Utilities',
    salaries: 'Salaries',
    transport: 'Transport',
    supplies: 'Supplies',
    marketing: 'Marketing',
    maintenance: 'Maintenance',
    tax: 'Tax',
    insurance: 'Insurance',
    licenses: 'Licenses',
    equipment: 'Equipment',
    other: 'Other'
  };

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      params.limit = itemsPerPage;
      params.offset = (currentPage - 1) * itemsPerPage;

      const response = await axios.get('/expenses', { params });
      setExpenses(response.data.data?.expenses || []);
      setTotalPages(Math.ceil((response.data.data?.total || 0) / itemsPerPage));
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, dateRange, currentPage]);

  // ✅ FIXED: Remove date filters from summary - show all-time totals
  const fetchSummary = useCallback(async () => {
    try {
      const response = await axios.get('/expenses/summary');
      setSummary(response.data.data || { 
        summary: { totalAmount: 0, count: 0 }, 
        byCategory: [] 
      });
    } catch (err) {
      console.error('Error fetching expense summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchSummary();
  }, [fetchExpenses, fetchSummary]);

  const handleDelete = async (id, description) => {
    if (!window.confirm(`Delete "${description}"? This action cannot be undone.`)) return;

    try {
      setDeleting(id);
      await axios.delete(`/expenses/${id}`);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryLabel = (cat) => {
    return categoryLabels[cat] || cat || 'Other';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      rent: '#2E7D32',
      utilities: '#1565C0',
      salaries: '#6A1B9A',
      transport: '#E65100',
      supplies: '#00838F',
      marketing: '#C62828',
      maintenance: '#4E342E',
      tax: '#D84315',
      insurance: '#1A237E',
      licenses: '#004D40',
      equipment: '#4A148C',
      other: '#5D4037'
    };
    return colors[cat] || '#5D4037';
  };

  const getCategoryBg = (cat) => {
    const bg = {
      rent: '#E8F5E9',
      utilities: '#E3F2FD',
      salaries: '#F3E5F5',
      transport: '#FFF3E0',
      supplies: '#E0F7FA',
      marketing: '#FFEBEE',
      maintenance: '#EFEBE9',
      tax: '#FBE9E7',
      insurance: '#E8EAF6',
      licenses: '#E0F2F1',
      equipment: '#F3E5F5',
      other: '#EFEBE9'
    };
    return bg[cat] || '#EFEBE9';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="expenses-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="expenses-container">
      {/* Header */}
      <div className="expenses-header">
        <div className="expenses-header-left">
          <h2>Expenses</h2>
          <span className="expenses-count">
            {summary?.summary?.count || 0} transactions
          </span>
        </div>
        <button className="expenses-add-btn" onClick={() => navigate('/expenses/add')}>
          <FontAwesomeIcon icon={faPlus} /> Add Expense
        </button>
      </div>

      {/* Summary Stats - Shows ALL expenses */}
      <div className="expenses-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{formatCurrency(summary?.summary?.totalAmount || 0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E3F2FD', color: '#1565C0' }}>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Transactions</span>
            <span className="stat-value">{summary?.summary?.count || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#FFF3E0', color: '#E65100' }}>
            <FontAwesomeIcon icon={faFilter} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Categories</span>
            <span className="stat-value">{summary?.byCategory?.length || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#E0F7FA', color: '#00838F' }}>
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Per Transaction</span>
            <span className="stat-value">
              {formatCurrency((summary?.summary?.totalAmount || 0) / (summary?.summary?.count || 1))}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown - Shows ALL expenses */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="expenses-category-breakdown">
          <h4>By Category</h4>
          <div className="category-tags">
            {summary.byCategory.map((cat) => (
              <div 
                key={cat._id} 
                className="category-tag"
                style={{ 
                  backgroundColor: getCategoryBg(cat._id),
                  borderColor: getCategoryColor(cat._id)
                }}
                onClick={() => {
                  setCategoryFilter(cat._id === categoryFilter ? '' : cat._id);
                  setCurrentPage(1);
                }}
              >
                <span className="category-label">{getCategoryLabel(cat._id)}</span>
                <span className="category-amount">{formatCurrency(cat.totalAmount)}</span>
                <span className="category-count">{cat.count} txns</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="expenses-toolbar">
        <div className="expenses-search">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FontAwesomeIcon icon={faFilter} /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="expenses-filters">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
          <button 
            className="clear-filters"
            onClick={() => {
              setCategoryFilter('');
              setDateRange({ start: '', end: '' });
              setSearch('');
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Expense List */}
      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="expenses-empty">
            <FontAwesomeIcon icon={faMoneyBillWave} size={48} />
            <p>No expenses found</p>
            <span>Add your first expense to start tracking</span>
            <button onClick={() => navigate('/expenses/add')}>
              Add Expense
            </button>
          </div>
        ) : (
          expenses.map((expense) => (
            <div key={expense._id} className="expense-item">
              <div className="expense-item-left">
                <div 
                  className="expense-category-icon"
                  style={{ 
                    backgroundColor: getCategoryBg(expense.category),
                    color: getCategoryColor(expense.category)
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </div>
                <div className="expense-info">
                  <div className="expense-description">
                    {expense.description}
                    <span className="expense-category-badge" style={{ backgroundColor: getCategoryBg(expense.category) }}>
                      {getCategoryLabel(expense.category)}
                    </span>
                  </div>
                  <div className="expense-meta">
                    <span>{formatDate(expense.expenseDate)}</span>
                    {expense.paymentMethod && (
                      <span className="payment-method">{expense.paymentMethod}</span>
                    )}
                    {expense.reference && (
                      <span className="reference">Ref: {expense.reference}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="expense-item-right">
                <div className="expense-amount">
                  {formatCurrency(expense.amount)}
                </div>
                <div className="expense-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => navigate(`/expenses/edit/${expense._id}`)}
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(expense._id, expense.description)}
                    disabled={deleting === expense._id}
                    title="Delete"
                  >
                    {deleting === expense._id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {expenses.length > 0 && totalPages > 1 && (
        <div className="expenses-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} /> Previous
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
            Next <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </div>
  );
}