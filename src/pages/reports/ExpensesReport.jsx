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
  faMoneyBillWave,
  faFileExport,
  faSearch,
  faFilter,
  faTimes,
  faSave,
  faCalendarAlt,
  faTag,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';
import '../css/ExpensesReport.css';

export default function ExpensesReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    paymentMethod: 'cash',
    expenseDate: '',
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
      fetchExpenses();
      fetchSummary();
    }
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/reports/expenses', {
        params: { startDate, endDate, limit: 100 }
      });
      setExpenses(response.data.data?.expenses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('/reports/expenses/summary', {
        params: { startDate, endDate }
      });
      setSummary(response.data.data);
      const cats = response.data.data?.byCategory?.map(c => c._id) || [];
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const handleAddExpense = async () => {
    try {
      await axios.post('/reports/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expenseDate)
      });
      setShowAddModal(false);
      resetForm();
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await axios.delete(`/reports/expenses/${id}`);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'other',
      paymentMethod: 'cash',
      expenseDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditingExpense(null);
  };

  const formatCurrency = (amount) => `KES ${(amount || 0).toLocaleString()}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  const getCategoryLabel = (cat) => {
    const labels = {
      rent: 'Rent', utilities: 'Utilities', salaries: 'Salaries',
      transport: 'Transport', supplies: 'Supplies', marketing: 'Marketing',
      maintenance: 'Maintenance', tax: 'Tax', insurance: 'Insurance',
      licenses: 'Licenses', equipment: 'Equipment', other: 'Other'
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat) => {
    const colors = {
      rent: '#EF4444', utilities: '#F59E0B', salaries: '#3B82F6',
      transport: '#8B5CF6', supplies: '#10B981', marketing: '#EC4899',
      maintenance: '#6B7280', tax: '#DC2626', insurance: '#059669',
      licenses: '#D97706', equipment: '#4F46E5', other: '#9CA3AF'
    };
    return colors[cat] || '#9CA3AF';
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exp.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  if (loading) {
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
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/reports')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h2>Expenses</h2>
            <p>Track and manage all business expenses</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}>
            <FontAwesomeIcon icon={faPlus} /> Add Expense
          </button>
          <button className="btn-outline">
            <FontAwesomeIcon icon={faFileExport} /> Export
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="expenses-date-range">
        <div className="date-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="date-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => { fetchExpenses(); fetchSummary(); }}>
          <FontAwesomeIcon icon={faDownload} /> Update
        </button>
      </div>

      {error && (
        <div className="expenses-error">
          <p>{error}</p>
          <button onClick={fetchExpenses} className="btn-primary">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="expenses-summary-cards">
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Total Expenses</span>
              <span className="summary-value">{formatCurrency(summary.summary?.totalAmount)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#eff6ff', color: '#1e40af' }}>
              <FontAwesomeIcon icon={faTag} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Number of Expenses</span>
              <span className="summary-value">{summary.summary?.count || 0}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
              <FontAwesomeIcon icon={faChartPie} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Average Expense</span>
              <span className="summary-value">{formatCurrency(summary.summary?.averageAmount)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="summary-content">
              <span className="summary-label">Categories</span>
              <span className="summary-value">{summary.byCategory?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Categories Breakdown */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="expenses-categories">
          <h3>Expenses by Category</h3>
          <div className="category-chips">
            {summary.byCategory.map((cat) => (
              <div key={cat._id} className="category-chip">
                <span className="chip-dot" style={{ backgroundColor: getCategoryColor(cat._id) }} />
                <span className="chip-name">{getCategoryLabel(cat._id)}</span>
                <span className="chip-amount">{formatCurrency(cat.totalAmount)}</span>
                <span className="chip-percent">
                  {((cat.totalAmount / summary.summary.totalAmount) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="expenses-toolbar">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search expenses..."
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
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
            ))}
          </select>
        </div>
        <div className="total-display">
          Total: <strong>{formatCurrency(totalExpenses)}</strong>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="expenses-table-container">
        {filteredExpenses.length === 0 ? (
          <div className="expenses-empty">
            <FontAwesomeIcon icon={faMoneyBillWave} />
            <p>No expenses found</p>
            <button className="btn-primary" onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}>
              Add your first expense
            </button>
          </div>
        ) : (
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Payment</th>
                <th className="amount">Amount</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp._id}>
                  <td>{formatDate(exp.expenseDate)}</td>
                  <td>
                    <div className="exp-desc">
                      <span>{exp.description}</span>
                      {exp.notes && <small>{exp.notes}</small>}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge" style={{ backgroundColor: getCategoryColor(exp.category) + '20', color: getCategoryColor(exp.category) }}>
                      {getCategoryLabel(exp.category)}
                    </span>
                  </td>
                  <td>
                    <span className="payment-badge">{exp.paymentMethod?.toUpperCase() || 'CASH'}</span>
                  </td>
                  <td className="amount">{formatCurrency(exp.amount)}</td>
                  <td className="actions">
                    <button className="action-btn edit" onClick={() => {
                      setEditingExpense(exp);
                      setFormData({
                        description: exp.description,
                        amount: exp.amount,
                        category: exp.category,
                        paymentMethod: exp.paymentMethod || 'cash',
                        expenseDate: new Date(exp.expenseDate).toISOString().split('T')[0],
                        notes: exp.notes || ''
                      });
                      setShowAddModal(true);
                    }}>
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteExpense(exp._id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (KES) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="salaries">Salaries</option>
                    <option value="transport">Transport</option>
                    <option value="supplies">Supplies</option>
                    <option value="marketing">Marketing</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="tax">Tax</option>
                    <option value="insurance">Insurance</option>
                    <option value="licenses">Licenses</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={formData.paymentMethod} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="other">Other</option>
                  </select>
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
              <button className="btn-primary" onClick={handleAddExpense} disabled={!formData.description || !formData.amount || !formData.expenseDate}>
                <FontAwesomeIcon icon={faSave} /> {editingExpense ? 'Update' : 'Save'} Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}