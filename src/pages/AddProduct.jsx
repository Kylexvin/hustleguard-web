// src/pages/AddProduct.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faImage,
  faTag,
  faMoneyBill,
  faBox,
  faStore,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './css/AddProduct.css';

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    minStockAlert: '5',
    supplier: '',
    supplierPrice: '',
    description: ''
  });

  const categories = [
    'Electronics',
    'Clothing',
    'Food',
    'Beverages',
    'Health',
    'Beauty',
    'Home',
    'Sports',
    'Toys',
    'Books',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // API call will go here
    console.log('Product data:', formData);
    setTimeout(() => {
      setLoading(false);
      navigate('/products');
    }, 1000);
  };

  return (
    <div className="add-product-container">
      {/* Header */}
      <div className="add-product-header">
        <button className="add-product-back" onClick={() => navigate('/products')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>Add Product</h2>
        <div className="add-product-header-spacer"></div>
      </div>

      <form onSubmit={handleSubmit} className="add-product-form">
        {/* Image Upload */}
        <div className="add-product-image-section">
          <div className="add-product-image-placeholder">
            <FontAwesomeIcon icon={faImage} />
            <span>Add Product Image</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="add-product-section">
          <h3>Basic Information</h3>
          
          <div className="add-product-field">
            <label>Product Name *</label>
            <div className="add-product-input-wrapper">
              <FontAwesomeIcon icon={faTag} className="add-product-input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="add-product-field">
            <label>Category *</label>
            <div className="add-product-input-wrapper">
              <FontAwesomeIcon icon={faStore} className="add-product-input-icon" />
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="add-product-field">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="add-product-section">
          <h3>Pricing</h3>
          
          <div className="add-product-row">
            <div className="add-product-field half">
              <label>Buying Price *</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faMoneyBill} className="add-product-input-icon" />
                <input
                  type="number"
                  name="buyingPrice"
                  placeholder="0.00"
                  value={formData.buyingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="add-product-field half">
              <label>Selling Price *</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faMoneyBill} className="add-product-input-icon" />
                <input
                  type="number"
                  name="sellingPrice"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="add-product-row">
            <div className="add-product-field half">
              <label>Supplier</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faBox} className="add-product-input-icon" />
                <input
                  type="text"
                  name="supplier"
                  placeholder="Supplier name"
                  value={formData.supplier}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="add-product-field half">
              <label>Supplier Price</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faMoneyBill} className="add-product-input-icon" />
                <input
                  type="number"
                  name="supplierPrice"
                  placeholder="0.00"
                  value={formData.supplierPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="add-product-section">
          <h3>Stock</h3>
          
          <div className="add-product-row">
            <div className="add-product-field half">
              <label>Quantity *</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faBox} className="add-product-input-icon" />
                <input
                  type="number"
                  name="quantity"
                  placeholder="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="add-product-field half">
              <label>Min Stock Alert</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faExclamationTriangle} className="add-product-input-icon" />
                <input
                  type="number"
                  name="minStockAlert"
                  placeholder="5"
                  value={formData.minStockAlert}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="add-product-actions">
          <button 
            type="button" 
            className="add-product-cancel"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="add-product-submit"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSave} />
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}