// src/pages/AddProduct.jsx - Simplified version
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faTag,
  faMoneyBill,
  faBox,
  faStore,
  faExclamationTriangle,
  faSpinner,
  faBarcode,
  faRuler
} from '@fortawesome/free-solid-svg-icons';
import './css/AddProduct.css';

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyingPrice: '',
    sellingPrice: '',
    quantity: '',
    minStockAlert: '3',
    supplier: '',
    supplierPrice: '',
    description: '',
    barcode: '',
    unit: 'pcs'
  });

  const units = ['pcs', 'kg', 'g', 'ml', 'L', 'pack', 'box', 'dozen', 'pair', 'set', 'roll', 'meter', 'cm', 'inch', 'other'];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/products');
      const products = response.data.data || [];
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      
      if (uniqueCategories.length === 0) {
        setCategories([
          'Electronics', 'Clothing', 'Food', 'Beverages', 
          'Health', 'Beauty', 'Home', 'Sports', 'Toys', 'Books', 'Other'
        ]);
      } else {
        setCategories(uniqueCategories);
      }
    } catch (err) {
      setCategories([
        'Electronics', 'Clothing', 'Food', 'Beverages', 
        'Health', 'Beauty', 'Home', 'Sports', 'Toys', 'Books', 'Other'
      ]);
    }
  };

  const fetchProduct = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const response = await axios.get(`/products/${id}`);
      const product = response.data.data;
      setFormData({
        name: product.name || '',
        category: product.category || '',
        buyingPrice: product.buyingPrice || '',
        sellingPrice: product.sellingPrice || '',
        quantity: product.quantity || '',
        minStockAlert: product.minStockAlert || '3',
        supplier: product.supplier || '',
        supplierPrice: product.supplierPrice || '',
        description: product.description || '',
        barcode: product.barcode || '',
        unit: product.unit || 'pcs'
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product data. Please try again.');
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [isEditing, fetchProduct]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        buyingPrice: parseFloat(formData.buyingPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        minStockAlert: parseInt(formData.minStockAlert),
        ...(formData.supplier && { supplier: formData.supplier }),
        ...(formData.supplierPrice && { supplierPrice: parseFloat(formData.supplierPrice) }),
        ...(formData.description && { description: formData.description }),
        ...(formData.barcode && { barcode: formData.barcode }),
        unit: formData.unit || 'pcs'
      };

      if (isEditing) {
        await axios.put(`/products/${id}`, productData);
      } else {
        await axios.post('/products', productData);
      }

      navigate('/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="add-product-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <button className="add-product-back" onClick={() => navigate('/products')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>{isEditing ? 'Edit Product' : 'Add Product'}</h2>
        <div className="add-product-header-spacer"></div>
      </div>

      {error && (
        <div className="add-product-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-product-form">
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

          <div className="add-product-row">
            <div className="add-product-field half">
              <label>Barcode (optional)</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faBarcode} className="add-product-input-icon" />
                <input
                  type="text"
                  name="barcode"
                  placeholder="Enter barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="add-product-field half">
              <label>Unit</label>
              <div className="add-product-input-wrapper">
                <FontAwesomeIcon icon={faRuler} className="add-product-input-icon" />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
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
                  placeholder="3"
                  value={formData.minStockAlert}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

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
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                {isEditing ? 'Update Product' : 'Save Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}