// src/pages/Pos.jsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faMinus, 
  faTrash, 
  faCreditCard, 
  faCashRegister,
  faTimes,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import './css/Pos.css';

export default function Pos() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');

  // Sample products - replace with API data
  const products = [
    { id: 1, name: 'Laptop Pro', price: 750, stock: 10 },
    { id: 2, name: 'Wireless Mouse', price: 35, stock: 50 },
    { id: 3, name: 'Smartphone X', price: 600, stock: 5 },
    { id: 4, name: 'USB Cable', price: 12, stock: 20 },
    { id: 5, name: 'Office Chair', price: 150, stock: 15 },
    { id: 6, name: 'Coffee Beans', price: 25, stock: 30 },
    { id: 7, name: 'Notebook', price: 8, stock: 40 },
    { id: 8, name: 'Pen Set', price: 5, stock: 60 },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pos-container">
      {/* Header */}
      <div className="pos-header">
        <div className="pos-header-left">
          <FontAwesomeIcon icon={faCashRegister} className="pos-header-icon" />
          <h2>POS</h2>
        </div>
        <div className="pos-header-right">
          <span className="pos-item-count">{itemCount} items</span>
        </div>
      </div>

      {/* Search */}
      <div className="pos-search">
        <FontAwesomeIcon icon={faSearch} className="pos-search-icon" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="pos-search-clear" onClick={() => setSearch('')}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="pos-products">
        {filteredProducts.length === 0 ? (
          <div className="pos-empty">
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="pos-product-card">
              <div className="pos-product-info">
                <h4>{product.name}</h4>
                <span className="pos-product-price">KES {product.price}</span>
                <span className="pos-product-stock">{product.stock} left</span>
              </div>
              <button 
                className="pos-add-btn"
                onClick={() => addToCart(product)}
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Cart Section - Always visible */}
      <div className="pos-cart-section">
        <div className="pos-cart-header">
          <h3>
            <FontAwesomeIcon icon={faShoppingCart} /> Cart
          </h3>
          <span className="pos-cart-count">{itemCount} items</span>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <p className="pos-empty-cart">No items in cart</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-cart-item-info">
                  <span className="pos-cart-item-name">{item.name}</span>
                  <span className="pos-cart-item-price">KES {item.price}</span>
                </div>
                <div className="pos-cart-item-actions">
                  <button onClick={() => updateQuantity(item.id, -1)}>
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span className="pos-cart-item-qty">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                  <button 
                    className="pos-cart-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-footer">
          <div className="pos-cart-total">
            <span>Total</span>
            <span>KES {total.toFixed(2)}</span>
          </div>
          <button 
            className="pos-cart-pay" 
            disabled={cart.length === 0}
          >
            <FontAwesomeIcon icon={faCreditCard} /> Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}