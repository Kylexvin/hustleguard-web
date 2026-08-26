// src/pages/Categories.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faBox,
  faSpinner,
  faTimes,
  faTag
} from '@fortawesome/free-solid-svg-icons';
import './css/Categories.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/categories');
      setCategories(response.data.data || []);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editing) {
        await axios.put(`/categories/${editing._id}`, {
          name: formData.name.trim(),
          description: formData.description.trim()
        });
      } else {
        await axios.post('/categories', {
          name: formData.name.trim(),
          description: formData.description.trim()
        });
      }

      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirm = window.confirm(`Delete category "${name}"? Products will be uncategorized.`);
    if (!confirm) return;

    try {
      setDeleting(id);
      await axios.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (category) => {
    setEditing(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
    setError(null);
  };

  const openAddModal = () => {
    setEditing(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
    setError(null);
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Color options
  const colorOptions = [
    '#6B7280', '#EF4444', '#F59E0B', '#10B981',
    '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'
  ];

  return (
    <div className="categories-container">
      {/* Header */}
      <div className="categories-header">
        <div className="categories-header-left">
          <h2><FontAwesomeIcon icon={faTag} /> Categories</h2>
          <span className="categories-count">{categories.length} total</span>
        </div>
        <button className="categories-add-btn" onClick={openAddModal}>
          <FontAwesomeIcon icon={faPlus} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="categories-search">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {error && (
        <div className="categories-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Category Grid */}
      <div className="categories-grid">
        {loading ? (
          <div className="categories-loading">
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="categories-empty">
            <FontAwesomeIcon icon={faBox} />
            <p>{search ? 'No categories match your search' : 'No categories yet'}</p>
            <button onClick={openAddModal}>
              {search ? 'Clear search' : 'Add your first category'}
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat._id} className="category-card">
              <div className="category-info">
                <div className="category-icon" style={{ background: cat.color || '#E8ECF0' }}>
                  {cat.icon || '📦'}
                </div>
                <div className="category-details">
                  <h4>{cat.name}</h4>
                  <p className="category-description">{cat.description || 'No description'}</p>
                  <span className="category-count">{cat.productCount || 0} products</span>
                </div>
              </div>
              <div className="category-actions">
                <button
                  className="category-edit-btn"
                  onClick={() => openEditModal(cat)}
                  title="Edit"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  className="category-delete-btn"
                  onClick={() => handleDelete(cat._id, cat.name)}
                  disabled={deleting === cat._id}
                  title={cat.productCount > 0 ? `Has ${cat.productCount} products` : 'Delete'}
                >
                  {deleting === cat._id ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="category-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Enter category description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={submitting || !formData.name.trim()}>
                  {submitting ? (
                    <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
                  ) : (
                    editing ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}