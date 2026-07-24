// src/pages/Products.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faEdit, 
  faTrash, 
  faBox,
  faTimes,
  faChevronRight,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faShoppingCart,
  faMinus,
  faPlus as faPlusIcon
} from '@fortawesome/free-solid-svg-icons';
import './css/Products.css';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'low-stock', 'out-of-stock'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [updatingStock, setUpdatingStock] = useState(null);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/products');
      const productData = response.data.data || [];
      setProducts(productData);
      
      // Extract unique categories from products
      const uniqueCategories = ['All', ...new Set(productData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      await axios.delete(`/products/${id}`);
      const updatedProducts = products.filter(p => p._id !== id);
      setProducts(updatedProducts);
      
      const uniqueCategories = ['All', ...new Set(updatedProducts.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      if (selectedCategory !== 'All' && !uniqueCategories.includes(selectedCategory)) {
        setSelectedCategory('All');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleStockUpdate = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 0) {
      alert('Cannot reduce stock below 0');
      return;
    }

    try {
      setUpdatingStock(id);
      await axios.patch(`/products/${id}/stock`, { quantityChange: change });
      
      // Update local state
      const updatedProducts = products.map(p => {
        if (p._id === id) {
          return { ...p, quantity: newQuantity };
        }
        return p;
      });
      setProducts(updatedProducts);
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock. Please try again.');
    } finally {
      setUpdatingStock(null);
    }
  };

  // Filter products based on tab, search, and category
  const getFilteredProducts = () => {
    let filtered = products;

    // Apply tab filter
    if (selectedTab === 'low-stock') {
      filtered = filtered.filter(p => p.quantity <= p.minStockAlert && p.quantity > 0);
    } else if (selectedTab === 'out-of-stock') {
      filtered = filtered.filter(p => p.quantity === 0);
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'status-out' };
    if (stock <= minStock) return { label: 'Low Stock', class: 'status-low' };
    return { label: 'In Stock', class: 'status-in' };
  };

  // Get counts for tabs
  const getLowStockCount = () => {
    return products.filter(p => p.quantity <= p.minStockAlert && p.quantity > 0).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => p.quantity === 0).length;
  };

  if (loading) {
    return (
      <div className="products-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <p>{error}</p>
        <button onClick={fetchProducts} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Header */}
      <div className="products-header">
        <h2>Products</h2>
        <button 
          className="add-product-btn"
          onClick={() => navigate('/products/add')}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Product
        </button>
      </div>

      {/* Tabs */}
      <div className="products-tabs">
        <button
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          <FontAwesomeIcon icon={faBox} /> All Products
          <span className="tab-count">{products.length}</span>
        </button>
        <button
          className={`tab-btn ${selectedTab === 'low-stock' ? 'active' : ''}`}
          onClick={() => setSelectedTab('low-stock')}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} /> Low Stock
          {getLowStockCount() > 0 && (
            <span className="tab-count warning">{getLowStockCount()}</span>
          )}
        </button>
        <button
          className={`tab-btn ${selectedTab === 'out-of-stock' ? 'active' : ''}`}
          onClick={() => setSelectedTab('out-of-stock')}
        >
          <FontAwesomeIcon icon={faShoppingCart} /> Out of Stock
          {getOutOfStockCount() > 0 && (
            <span className="tab-count danger">{getOutOfStockCount()}</span>
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="products-search-section">
        <div className="products-search">
          <FontAwesomeIcon icon={faSearch} className="products-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="products-search-clear" onClick={() => setSearch('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="products-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Count */}
      <div className="products-count">
        <span>{filteredProducts.length} products</span>
        {selectedTab === 'low-stock' && (
          <span className="stock-alert-info">⚠️ Products below minimum stock level</span>
        )}
        {selectedTab === 'out-of-stock' && (
          <span className="stock-alert-info">🚫 Products that need restocking</span>
        )}
      </div>

      {/* Product List */}
      <div className="products-list">
        {filteredProducts.length === 0 ? (
          <div className="products-empty">
            {selectedTab === 'low-stock' ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                <p>No low stock products!</p>
                <span>All products are above minimum stock level</span>
              </>
            ) : selectedTab === 'out-of-stock' ? (
              <>
                <FontAwesomeIcon icon={faCheckCircle} />
                <p>All products are in stock!</p>
                <span>No products are out of stock</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faBox} />
                <p>No products found</p>
                <button onClick={() => navigate('/products/add')}>Add your first product</button>
              </>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const status = getStockStatus(product.quantity, product.minStockAlert);
            const isLowStock = product.quantity <= product.minStockAlert;
            const isOutOfStock = product.quantity === 0;
            
            return (
              <div key={product._id} className={`product-item ${isLowStock ? 'low-stock-item' : ''} ${isOutOfStock ? 'out-of-stock-item' : ''}`}>
                <div className="product-info">
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <span className="product-category">{product.category}</span>
                    {product.barcode && (
                      <span className="product-barcode">📷 {product.barcode}</span>
                    )}
                  </div>
                  <div className="product-meta">
                    <span className="product-price">KES {product.sellingPrice}</span>
                    <span className="product-buying-price">Buy: KES {product.buyingPrice}</span>
                    <span className={`product-stock ${status.class}`}>
                      {status.label} ({product.quantity} {product.unit})
                    </span>
                    {isLowStock && !isOutOfStock && (
                      <span className="stock-warning">⚠️ Below minimum ({product.minStockAlert})</span>
                    )}
                  </div>
                </div>
                <div className="product-actions">
                  {/* Quick Stock Adjust */}
                  <div className="stock-adjust">
                    <button
                      className="stock-adjust-btn minus"
                      onClick={() => handleStockUpdate(product._id, product.quantity, -1)}
                      disabled={updatingStock === product._id || product.quantity === 0}
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="stock-quantity">{product.quantity}</span>
                    <button
                      className="stock-adjust-btn plus"
                      onClick={() => handleStockUpdate(product._id, product.quantity, 1)}
                      disabled={updatingStock === product._id}
                    >
                      <FontAwesomeIcon icon={faPlusIcon} />
                    </button>
                  </div>
                  
                  <button 
                    className="product-edit-btn"
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    className="product-delete-btn"
                    onClick={() => handleDelete(product._id, product.name)}
                    disabled={deleting === product._id}
                  >
                    {deleting === product._id ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </button>
                  <FontAwesomeIcon icon={faChevronRight} className="product-arrow" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <button 
        className="products-fab"
        onClick={() => navigate('/products/add')}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
}