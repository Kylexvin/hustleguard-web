// src/pages/Products.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faEdit, 
  faTrash, 
  faBox,
  faTimes,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './css/Products.css';

export default function Products() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Sample products - replace with API data
  const [products] = useState([
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 750, stock: 10, minStock: 3 },
    { id: 2, name: 'Wireless Mouse', category: 'Electronics', price: 35, stock: 50, minStock: 10 },
    { id: 3, name: 'Smartphone X', category: 'Electronics', price: 600, stock: 5, minStock: 5 },
    { id: 4, name: 'USB Cable', category: 'Electronics', price: 12, stock: 0, minStock: 20 },
    { id: 5, name: 'Office Chair', category: 'Home', price: 150, stock: 15, minStock: 5 },
    { id: 6, name: 'Coffee Beans', category: 'Food', price: 25, stock: 30, minStock: 8 },
    { id: 7, name: 'Notebook Set', category: 'Other', price: 8, stock: 2, minStock: 5 },
    { id: 8, name: 'Pen Set', category: 'Other', price: 5, stock: 60, minStock: 20 },
  ]);

  const categories = ['All', 'Electronics', 'Home', 'Food', 'Clothing', 'Health', 'Beauty', 'Sports', 'Toys', 'Books', 'Other'];

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
            const status = getStockStatus(product.stock, product.minStock);
            return (
              <div key={product.id} className="product-item">
                <div className="product-info">
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <span className="product-category">{product.category}</span>
                  </div>
                  <div className="product-meta">
                    <span className="product-price">KES {product.price}</span>
                    <span className={`product-stock ${status.class}`}>
                      {status.label} ({product.stock})
                    </span>
                  </div>
                </div>
                <div className="product-actions">
                  <button 
                    className="product-edit-btn"
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button className="product-delete-btn">
                    <FontAwesomeIcon icon={faTrash} />
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