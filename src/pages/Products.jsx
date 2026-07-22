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
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './css/Products.css';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

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
      // Remove from state
      const updatedProducts = products.filter(p => p._id !== id);
      setProducts(updatedProducts);
      
      // Update categories if needed
      const uniqueCategories = ['All', ...new Set(updatedProducts.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // Reset selected category if it no longer exists
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

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'status-out' };
    if (stock <= minStock) return { label: 'Low Stock', class: 'status-low' };
    return { label: 'In Stock', class: 'status-in' };
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
      </div>

      {/* Product List */}
      <div className="products-list">
        {filteredProducts.length === 0 ? (
          <div className="products-empty">
            <FontAwesomeIcon icon={faBox} />
            <p>No products found</p>
            <button onClick={() => navigate('/products/add')}>Add your first product</button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const status = getStockStatus(product.quantity, product.minStockAlert);
            return (
              <div key={product._id} className="product-item">
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
                      {status.label} ({product.quantity})
                    </span>
                    {product.unit && (
                      <span className="product-unit">{product.unit}</span>
                    )}
                  </div>
                </div>
                <div className="product-actions">
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