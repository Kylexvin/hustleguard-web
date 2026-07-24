// src/pages/AddProduct.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
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
        buyingPrice: product.buyingPrice !== undefined ? product.buyingPrice : '',
        sellingPrice: product.sellingPrice !== undefined ? product.sellingPrice : '',
        quantity: product.quantity !== undefined ? product.quantity : '',
        minStockAlert: product.minStockAlert || '3',
        supplier: product.supplier || '',
        supplierPrice: product.supplierPrice !== undefined ? product.supplierPrice : '',
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) setError(null);
  };

  const resetForm = () => {
    setFormData({
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
    setError(null);
  };

  const showSuccessDialog = (productName, isEdit) => {
    if (isEdit) {
      // For editing: Just show success and go to products
      Swal.fire({
        title: 'Product Updated!',
        text: `"${productName}" has been updated successfully.`,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'View Products',
        backdrop: 'rgba(0,0,0,0.4)',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      }).then(() => {
        navigate('/products');
      });
    } else {
      // For adding: Ask if user wants to add more
      Swal.fire({
        title: 'Product Added!',
        text: `"${productName}" has been added to your inventory.`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Add Another Product',
        cancelButtonText: 'View Products',
        backdrop: 'rgba(0,0,0,0.4)',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // User wants to add another product
          resetForm();
          // Focus on the name input
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput) nameInput.focus();
        } else {
          // User wants to view products
          navigate('/products');
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const buyingPrice = parseFloat(formData.buyingPrice);
      const sellingPrice = parseFloat(formData.sellingPrice);
      const quantity = parseInt(formData.quantity);
      const minStockAlert = parseInt(formData.minStockAlert);

      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        setError('Product name is required.');
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setError('Please select a category.');
        setLoading(false);
        return;
      }

      if (formData.buyingPrice === '' || isNaN(buyingPrice) || buyingPrice < 0) {
        setError('Please enter a valid buying price.');
        setLoading(false);
        return;
      }

      if (formData.sellingPrice === '' || isNaN(sellingPrice) || sellingPrice < 0) {
        setError('Please enter a valid selling price.');
        setLoading(false);
        return;
      }

      if (sellingPrice < buyingPrice) {
        setError(`Selling price (${sellingPrice.toFixed(2)}) must be greater than or equal to buying price (${buyingPrice.toFixed(2)}).`);
        setLoading(false);
        return;
      }

      if (formData.quantity === '' || isNaN(quantity) || quantity < 0) {
        setError('Please enter a valid quantity.');
        setLoading(false);
        return;
      }

      // Build product data
      const productData = {
        name: formData.name.trim(),
        category: formData.category,
        buyingPrice: buyingPrice,
        sellingPrice: sellingPrice,
        quantity: quantity,
        unit: formData.unit || 'pcs'
      };

      if (!isNaN(minStockAlert) && minStockAlert >= 0) {
        productData.minStockAlert = minStockAlert;
      }

      if (formData.supplier && formData.supplier.trim()) {
        productData.supplier = formData.supplier.trim();
      }

      if (formData.supplierPrice && formData.supplierPrice !== '') {
        const supplierPrice = parseFloat(formData.supplierPrice);
        if (!isNaN(supplierPrice) && supplierPrice >= 0) {
          productData.supplierPrice = supplierPrice;
        }
      }

      if (formData.description && formData.description.trim()) {
        productData.description = formData.description.trim();
      }

      if (formData.barcode && formData.barcode.trim()) {
        const barcode = formData.barcode.trim();
        if (/^\d+$/.test(barcode)) {
          productData.barcode = barcode;
        } else {
          setError('Barcode must contain only numbers.');
          setLoading(false);
          return;
        }
      }

      console.log('Final product data being sent:', JSON.stringify(productData, null, 2));

      let response;
      if (isEditing) {
        response = await axios.put(`/products/${id}`, productData);
      } else {
        response = await axios.post('/products', productData);
      }

      console.log('API Response:', response.data);
      
      const productName = formData.name;
      
      // Show success dialog with options
      await showSuccessDialog(productName, isEditing);

    } catch (err) {
      console.error('Error saving product:', err);
      
      if (err.response) {
        console.error('Full error response:', JSON.stringify(err.response.data, null, 2));
        console.error('Error status:', err.response.status);
        
        let errorMessage = 'Failed to save product.';
        
        if (err.response.data) {
          if (err.response.data.message) {
            errorMessage = err.response.data.message;
          }
          if (err.response.data.errors) {
            const errorDetails = Object.values(err.response.data.errors).join(' ');
            errorMessage = errorDetails || errorMessage;
          }
        }
        
        setError(errorMessage);
        
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK'
        });
      } else {
        setError('Network error. Please check your connection.');
        Swal.fire({
          title: 'Error!',
          text: 'Network error. Please check your connection.',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK'
        });
      }
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

  const isSellingPriceValid = () => {
    if (!formData.buyingPrice || !formData.sellingPrice) return true;
    const buying = parseFloat(formData.buyingPrice);
    const selling = parseFloat(formData.sellingPrice);
    if (isNaN(buying) || isNaN(selling)) return true;
    return selling >= buying;
  };

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

      <form onSubmit={handleSubmit} className="add-product-form" noValidate>
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
                autoFocus
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
                  placeholder="Enter barcode (numbers only)"
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
                  className={!isSellingPriceValid() ? 'input-error' : ''}
                />
              </div>
              {!isSellingPriceValid() && (
                <div className="add-product-field-error">
                  Selling price must be greater than or equal to buying price
                </div>
              )}
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
            disabled={loading || !isSellingPriceValid()}
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