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
  faSpinner,
  faExclamationTriangle,
  faShoppingCart,
  faPackage,
  faTags,
  faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import './css/Products.css';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTab, setSelectedTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // ============================================================
  // Fetch products with UOM and stock info
  // ============================================================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/products');
      const productData = response.data.data || [];
      
      setProducts(productData);
      
      const uniqueCategories = ['All', ...new Set(productData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Delete product (soft delete)
  // ============================================================
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This will deactivate the product.`)) return;

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
      alert(err.response?.data?.message || 'Failed to delete product. Please remove stock first.');
    } finally {
      setDeleting(null);
    }
  };

  // ============================================================
  // Helpers
  // ============================================================
  const getStock = (product) => {
    return product.totalStock || product.quantity || 0;
  };

  const getBaseUnitLabel = (product) => {
    return product.baseUnit?.label || product.unit || 'Unit';
  };

  const getSellUnitsCount = (product) => {
    return product.sellUnits?.filter(u => u.isActive !== false).length || 1;
  };

  const getPrimaryPrice = (product) => {
    const baseUnit = product.sellUnits?.find(u => u.isBase);
    return baseUnit?.sellPrice || product.sellingPrice || 0;
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'out' };
    if (stock <= minStock) return { label: 'Low Stock', class: 'low' };
    return { label: 'In Stock', class: 'in' };
  };

  const getLowStockCount = () => {
    return products.filter(p => {
      const stock = getStock(p);
      const min = p.minStockAlert || 5;
      return stock <= min && stock > 0;
    }).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => getStock(p) === 0).length;
  };

  // ============================================================
  // Filter logic
  // ============================================================
  const getFilteredProducts = () => {
    let filtered = products;

    const stock = (p) => getStock(p);
    const minStock = (p) => p.minStockAlert || 5;

    if (selectedTab === 'low-stock') {
      filtered = filtered.filter(p => stock(p) <= minStock(p) && stock(p) > 0);
    } else if (selectedTab === 'out-of-stock') {
      filtered = filtered.filter(p => stock(p) === 0);
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.sellUnits?.some(u => u.barcode?.includes(term)) ||
        p.stockUnits?.some(u => u.barcode?.includes(term))
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // ============================================================
  // Render
  // ============================================================
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
        <button onClick={fetchProducts} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Header */}
      <div className="products-header">
        <h2>Products</h2>
        <button className="add-product-btn" onClick={() => navigate('/products/add')}>
          <FontAwesomeIcon icon={faPlus} /> Add Product
        </button>
      </div>

      {/* Tabs */}
      <div className="products-tabs">
        <button
          className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          <FontAwesomeIcon icon={faBox} /> All
          <span className="tab-count">{products.length}</span>
        </button>
        <button
          className={`tab-btn ${selectedTab === 'low-stock' ? 'active' : ''}`}
          onClick={() => setSelectedTab('low-stock')}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} /> Low
          {getLowStockCount() > 0 && (
            <span className="tab-count warning">{getLowStockCount()}</span>
          )}
        </button>
        <button
          className={`tab-btn ${selectedTab === 'out-of-stock' ? 'active' : ''}`}
          onClick={() => setSelectedTab('out-of-stock')}
        >
          <FontAwesomeIcon icon={faShoppingCart} /> Out
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
            placeholder="Search by name, barcode, category..."
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

      {/* Product Grid */}
      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="products-empty">
            <FontAwesomeIcon icon={faBox} />
            <p>No products found</p>
            <button onClick={() => navigate('/products/add')}>Add your first product</button>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = getStock(product);
            const minStock = product.minStockAlert || 5;
            const status = getStockStatus(stock, minStock);
            const isLowStock = stock <= minStock && stock > 0;
            const isOutOfStock = stock === 0;
            const baseUnitLabel = getBaseUnitLabel(product);
            const unitCount = getSellUnitsCount(product);
            const primaryPrice = getPrimaryPrice(product);
            
            return (
              <div 
                key={product._id} 
                className={`product-card ${isLowStock ? 'low-stock' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
              >
                {/* Top row: Name + Actions */}
                <div className="product-card-top">
                  <div className="product-name">
                    <h4>{product.name}</h4>
                    <span className="product-category">{product.category || 'Uncategorized'}</span>
                    {product.sellUnits?.some(u => u.barcode) && (
                      <span className="product-barcode">
                        {product.sellUnits.find(u => u.barcode)?.barcode}
                      </span>
                    )}
                  </div>
                  <div className="product-card-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => navigate(`/products/edit/${product._id}`)}
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(product._id, product.name)}
                      disabled={deleting === product._id}
                      title="Delete"
                    >
                      {deleting === product._id ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faTrash} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Middle: Stock & Price */}
                <div className="product-card-middle">
                  <div className="product-stock-info">
                    <span className={`stock-badge ${status.class}`}>
                      {status.label}
                    </span>
                    <span className="stock-quantity">
                      {stock} {baseUnitLabel}s
                    </span>
                    {isLowStock && !isOutOfStock && (
                      <span className="stock-warning">Min: {minStock}</span>
                    )}
                  </div>
                  <div className="product-price-info">
                    <span className="selling-price">KES {primaryPrice}</span>
                    {unitCount > 1 && (
                      <span className="unit-count" title="Multiple sell units available">
                        <FontAwesomeIcon icon={faTags} /> {unitCount} units
                      </span>
                    )}
                  </div>
                </div>

                {/* ============================================================
                    BOTTOM: Actions with Stock button linking to ProductStock page
                    ============================================================ */}
                <div className="product-card-bottom">
                  <div className="product-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/products/edit/${product._id}`)}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button 
                      className="stock-btn"
                      onClick={() => navigate(`/products/${product._id}/stock`)}
                      title="Manage Stock"
                    >
                      <FontAwesomeIcon icon={faLayerGroup} /> Stock
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button className="products-fab" onClick={() => navigate('/products/add')}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  );
}
