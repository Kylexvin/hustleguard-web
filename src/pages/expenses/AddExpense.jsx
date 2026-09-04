// src/pages/expenses/AddExpense.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faTimes,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import './css/AddExpense.css';

export default function AddExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [alert, setAlert] = useState(null);

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

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'other',
    paymentMethod: 'cash',
    reference: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (isEditing) {
      const fetchExpense = async () => {
        try {
          setFetching(true);
          const response = await axios.get(`/expenses/${id}`);
          const expense = response.data.data;
          setFormData({
            description: expense.description || '',
            amount: expense.amount || '',
            category: expense.category || 'other',
            paymentMethod: expense.paymentMethod || 'cash',
            reference: expense.reference || '',
            expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            notes: expense.notes || ''
          });
        } catch (err) {
          console.error('Error fetching expense:', err);
          setAlert({ message: 'Failed to load expense data', type: 'error' });
          setTimeout(() => navigate('/expenses'), 1500);
        } finally {
          setFetching(false);
        }
      };
      fetchExpense();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      setAlert({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setAlert({ message: 'Amount must be greater than 0', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        expenseDate: formData.expenseDate,
        notes: formData.notes
      };

      if (isEditing) {
        await axios.put(`/expenses/${id}`, payload);
      } else {
        await axios.post('/expenses', payload);
      }

      navigate('/expenses');
    } catch (err) {
      console.error('Error saving expense:', err);
      setAlert({ 
        message: err.response?.data?.message || 'Failed to save expense', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="add-expense-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading expense...</p>
      </div>
    );
  }

  return (
    <div className="add-expense-container">
      {/* Header */}
      <div className="add-expense-header">
        <button className="back-btn" onClick={() => navigate('/expenses')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h2>{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert ${alert.type}`}>
          <span>{alert.message}</span>
          <button className="alert-close" onClick={() => setAlert(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Form */}
      <form className="add-expense-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Description <span className="required">*</span></label>
          <input
            type="text"
            name="description"
            placeholder="e.g., Office rent for January"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>Amount <span className="required">*</span></label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-group half">
            <label>Date</label>
            <input
              type="date"
              name="expenseDate"
              value={formData.expenseDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>Category <span className="required">*</span></label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
              ))}
            </select>
          </div>
          <div className="form-group half">
            <label>Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Reference</label>
          <input
            type="text"
            name="reference"
            placeholder="Receipt or reference number"
            value={formData.reference}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            placeholder="Additional notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/expenses')}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
            ) : (
              <><FontAwesomeIcon icon={faSave} /> {isEditing ? 'Update Expense' : 'Save Expense'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}