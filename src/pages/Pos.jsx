// src/pages/Pos.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faMinus, 
  faTrash, 
  faCreditCard, 
  faTimes,
  faShoppingCart,
  faQrcode,
  faMicrophone,
  faMicrophoneSlash,
  faVolumeUp,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import './css/Pos.css';

export default function Pos() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState(null);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cartRef = useRef(cart);

  // Keep cartRef in sync with cart state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Add to cart
  const addToCart = useCallback((product) => {
    const currentCart = cartRef.current;
    const existing = currentCart.find(item => item.id === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(prev => prev.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
      toast.success(`Added another ${product.name}`);
    } else {
      if (product.stock === 0) {
        toast.error('Product out of stock');
        return;
      }
      setCart(prev => [...prev, { ...product, quantity: 1 }]);
      toast.success(`${product.name} added to cart`);
    }
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
    toast.success('Item removed');
  }, []);

  // Update quantity
  const updateQuantity = useCallback((id, change) => {
    const currentCart = cartRef.current;
    const item = currentCart.find(i => i.id === id);
    
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty > item.stock) {
      toast.error('Not enough stock');
      return;
    }
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
      return;
    }
    
    setCart(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: newQty } : i
    ));
  }, []);

  // Load initial products
  const loadInitialProducts = useCallback(async () => {
    try {
      setLoadingInitial(true);
      setError(null);
      const response = await axios.get('/products');
      
      if (response.data.success) {
        const posProducts = response.data.data.map(product => ({
          _id: product._id,
          name: product.name,
          sellingPrice: product.sellingPrice,
          quantity: product.quantity,
          barcode: product.barcode,
          category: product.category,
          unit: product.unit,
          minStockAlert: product.minStockAlert,
          buyingPrice: product.buyingPrice,
          isLowStock: product.quantity <= product.minStockAlert,
          isOutOfStock: product.quantity === 0
        }));
        setProducts(posProducts);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please refresh.');
      toast.error('Failed to load products');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      loadInitialProducts();
      return;
    }

    try {
      setSearching(true);
      setError(null);
      const response = await axios.get('/pos/products/search', {
        params: {
          query: query.trim(),
          limit: 50,
          includeOutOfStock: false
        }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to search products. Please try again.');
      toast.error('Failed to search products');
    } finally {
      setSearching(false);
    }
  }, [loadInitialProducts]);

  // Load products on mount
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current);
    if (search.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchProducts(search);
      }, 300);
    } else {
      loadInitialProducts();
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, searchProducts, loadInitialProducts]);

  // Get product by barcode
  const handleBarcodeScan = useCallback(async (barcode) => {
    if (!barcode || barcode.trim() === '') return;

    try {
      setBarcodeError(null);
      const response = await axios.get(`/pos/products/barcode/${barcode.trim()}`);
      
      if (response.data.success) {
        const product = response.data.data;
        addToCart({
          id: product._id,
          name: product.name,
          price: product.sellingPrice,
          stock: product.quantity,
          barcode: product.barcode,
          buyingPrice: product.buyingPrice || (product.sellingPrice * 0.7)
        });
        setBarcodeInput('');
      }
    } catch (err) {
      console.error('Error scanning barcode:', err);
      setBarcodeError('Product not found');
      toast.error('Product not found');
      setTimeout(() => setBarcodeError(null), 3000);
    }
  }, [addToCart]);

  // Handle checkout - NO VAT
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Calculate total (NO VAT)
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Confirm with SweetAlert
    const result = await Swal.fire({
      title: 'Confirm Sale',
      html: `
        <div style="text-align: left;">
          <p><strong>Items:</strong> ${cart.length}</p>
          <p><strong>Total:</strong> KES ${total.toFixed(2)}</p>
          <p><strong>Customer:</strong> ${customer || 'Walk-in'}</p>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Complete Sale',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setProcessingCheckout(true);
      
      // Create sale for each item in cart
      const salePromises = cart.map(async (item) => {
        const saleData = {
          productId: item.id,
          quantity: item.quantity,
          sellingPrice: item.price,
          customer: customer || 'Walk-in Customer',
          paymentMethod: paymentMethod,
          notes: `POS Sale - ${new Date().toLocaleString()}`
        };

        console.log('Sending sale data:', saleData);
        const response = await axios.post('/sales', saleData);
        return response.data;
      });

      await Promise.all(salePromises);
      
      toast.success(`Sale complete! Total: KES ${total.toFixed(2)}`);
      
      await Swal.fire({
        title: 'Sale Complete!',
        html: `
          <div style="text-align: left;">
            <p><strong>Total:</strong> KES ${total.toFixed(2)}</p>
            <p><strong>Items:</strong> ${cart.length}</p>
            <p><strong>Customer:</strong> ${customer || 'Walk-in'}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      setCart([]);
      setCustomer('');
      
    } catch (err) {
      console.error('Error processing sale:', err);
      const errorMsg = err.response?.data?.message || 'Failed to process sale.';
      toast.error(errorMsg);
      
      await Swal.fire({
        title: 'Sale Failed',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setProcessingCheckout(false);
    }
  }, [cart, customer, paymentMethod]);

  // Voice command processing
  const processVoiceCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase().trim();
    
    if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('remove all')) {
      setCart([]);
      setVoiceStatus('confirmed');
      toast('Cart cleared');
      setTimeout(() => setVoiceStatus('idle'), 1500);
      return;
    }

    if (lower.includes('checkout') || lower.includes('pay now') || lower.includes('complete sale')) {
      if (cart.length > 0) {
        handleCheckout();
      } else {
        toast.error('Cart is empty');
      }
      return;
    }

    if (lower.includes('remove') || lower.includes('delete')) {
      const match = products.find(p => lower.includes(p.name.toLowerCase()));
      if (match) {
        const existing = cart.find(item => item.id === match._id);
        if (existing) {
          if (existing.quantity > 1) {
            updateQuantity(match._id, -1);
          } else {
            removeFromCart(match._id);
          }
        } else {
          toast.error(`${match.name} not in cart`);
        }
      }
      return;
    }

    const words = lower.split(' ');
    let quantity = 1;
    let productName = '';
    
    for (let i = 0; i < words.length; i++) {
      const num = parseInt(words[i]);
      if (!isNaN(num)) {
        quantity = num;
      } else if (['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].includes(words[i])) {
        const numMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        quantity = numMap[words[i]] || 1;
      }
    }

    const cleanWords = words.filter(w => 
      isNaN(w) && 
      !['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 
        'add', 'please', 'need', 'want', 'get', 'would', 'like', 'can', 'could', 'have', 
        'of', 'and', 'the', 'a', 'an'].includes(w)
    );
    productName = cleanWords.join(' ');

    let matchedProduct = null;
    let matchedScore = 0;

    products.forEach(p => {
      const pLower = p.name.toLowerCase();
      const score = productName.split(' ').filter(word => 
        pLower.includes(word) || word.includes(pLower)
      ).length;
      
      if (score > matchedScore) {
        matchedScore = score;
        matchedProduct = p;
      }
    });

    if (matchedProduct && matchedScore > 0) {
      if (matchedProduct.quantity < quantity) {
        toast.error(`Only ${matchedProduct.quantity} in stock`);
        quantity = matchedProduct.quantity;
      }
      
      if (quantity > 0) {
        addToCart({
          id: matchedProduct._id,
          name: matchedProduct.name,
          price: matchedProduct.sellingPrice,
          stock: matchedProduct.quantity,
          buyingPrice: matchedProduct.buyingPrice
        });
        
        setVoiceStatus('confirmed');
        
        setTimeout(() => {
          setVoiceStatus('idle');
          setVoiceTranscript('');
        }, 2000);
      }
    } else if (productName.length > 3) {
      toast.error(`Couldn't find ${productName}`);
      setVoiceStatus('idle');
    }
  }, [cart, products, handleCheckout, updateQuantity, removeFromCart, addToCart]);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (transcript.trim()) {
            processVoiceCommand(transcript);
          }
        }, 1500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceStatus('idle');
          setIsListening(false);
          toast.error('Please allow microphone access');
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Ignore
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      clearTimeout(timeoutRef.current);
    };
  }, [isListening, processVoiceCommand]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setVoiceStatus('idle');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      toast('Voice stopped');
    } else {
      setIsListening(true);
      setVoiceStatus('listening');
      setVoiceTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => recognitionRef.current.start(), 100);
          } catch (err) {}
        }
      }
      toast.success('Listening...');
    }
  };

  // Handle barcode input
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    handleBarcodeScan(barcodeInput);
  };

  // Calculate totals (NO VAT)
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const voiceCommands = [
    'Add [product name]',
    'Add 3 [product name]',
    'Remove [product name]',
    'Clear cart',
    'Checkout'
  ];

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <div className="pos-container">
        {/* Left Column - Products */}
        <div className="pos-left">
          {/* Header */}
          <div className="pos-header">
            <div className="pos-header-left">
              <h2>POS</h2>
            </div>
            <div className="pos-header-right">
              <span className="pos-item-count">{itemCount} items</span>
            </div>
          </div>

          {/* Search & Barcode */}
          <div className="pos-search">
            <FontAwesomeIcon icon={faSearch} className="pos-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            
            <form onSubmit={handleBarcodeSubmit} style={{ display: 'none' }}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                id="barcode-scanner"
              />
            </form>
            
            <button 
              className="pos-scan-btn" 
              title="Scan barcode"
              onClick={() => document.getElementById('barcode-scanner')?.focus()}
            >
              <FontAwesomeIcon icon={faQrcode} />
            </button>
            
            <button 
              className={`pos-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice ordering'}
            >
              <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
              {isListening && <span className="pos-voice-pulse"></span>}
            </button>
            
            {search && (
              <button className="pos-search-clear" onClick={() => setSearch('')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          {/* Barcode error */}
          {barcodeError && (
            <div className="pos-barcode-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{barcodeError}</span>
            </div>
          )}

          {/* Voice Status */}
          {isListening && (
            <div className="pos-voice-status">
              <div className="pos-voice-indicator">
                <span className={`pos-voice-dot ${voiceStatus}`}></span>
                <span className="pos-voice-text">
                  {voiceStatus === 'listening' && 'Listening... Speak product name'}
                  {voiceStatus === 'confirmed' && 'Added to cart!'}
                  {voiceStatus === 'idle' && 'Ready...'}
                </span>
              </div>
              {voiceTranscript && (
                <div className="pos-voice-transcript">
                  <FontAwesomeIcon icon={faVolumeUp} />
                  <span>"{voiceTranscript}"</span>
                </div>
              )}
            </div>
          )}

          {/* Voice Help */}
          {!isListening && (
            <div className="pos-voice-help">
              <FontAwesomeIcon icon={faMicrophone} />
              <span>Click mic to order by voice</span>
              <button className="pos-voice-help-toggle" onClick={() => {
                Swal.fire({
                  title: 'Voice Commands',
                  html: `
                    <ul style="text-align: left;">
                      ${voiceCommands.map(cmd => `<li>${cmd}</li>`).join('')}
                    </ul>
                  `,
                  icon: 'info',
                  confirmButtonText: 'Got it'
                });
              }}>
                ?
              </button>
            </div>
          )}

          {/* Loading/Error States */}
          {loadingInitial ? (
            <div className="pos-loading">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Loading products...</span>
            </div>
          ) : searching ? (
            <div className="pos-loading">
              <FontAwesomeIcon icon={faSpinner} spin />
              <span>Searching...</span>
            </div>
          ) : error ? (
            <div className="pos-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          ) : null}

          {/* Product Grid */}
          <div className="pos-products">
            {!loadingInitial && !searching && products.length === 0 && (
              <div className="pos-empty">
                <p>No products available</p>
                <span>Add products from the Products page</span>
              </div>
            )}
            {products.map((product) => (
              <div key={product._id} className="pos-product-card">
                <div className="pos-product-info">
                  <h4>{product.name}</h4>
                  <div className="pos-product-meta">
                    <span className="pos-product-price">KES {product.sellingPrice}</span>
                    <span className={`pos-product-stock ${product.isLowStock ? 'low' : ''} ${product.isOutOfStock ? 'out' : ''}`}>
                      {product.quantity} left
                    </span>
                    {product.isLowStock && !product.isOutOfStock && (
                      <span className="pos-stock-warning">Low</span>
                    )}
                  </div>
                </div>
                <button 
                  className="pos-add-btn"
                  onClick={() => addToCart({
                    id: product._id,
                    name: product.name,
                    price: product.sellingPrice,
                    stock: product.quantity,
                    buyingPrice: product.buyingPrice
                  })}
                  disabled={product.isOutOfStock}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="pos-right">
          <div className="pos-cart">
            {/* Cart Header */}
            <div className="pos-cart-header">
              <h3>
                <FontAwesomeIcon icon={faShoppingCart} /> Cart
              </h3>
              <span className="pos-cart-count">{itemCount} items</span>
            </div>

            {/* Cart Items */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-empty-cart">
                  <FontAwesomeIcon icon={faShoppingCart} />
                  <p>No items in cart</p>
                  <span>Search or speak to add items</span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pos-cart-item">
                    <div className="pos-cart-item-info">
                      <span className="pos-cart-item-name">{item.name}</span>
                      <span className="pos-cart-item-price">KES {item.price}</span>
                    </div>
                    <div className="pos-cart-item-actions">
                      <button 
                        className="pos-qty-btn minus"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="pos-cart-item-qty">{item.quantity}</span>
                      <button 
                        className="pos-qty-btn plus"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
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

            {/* Checkout - NO VAT */}
            <div className="pos-checkout">
              {/* Customer Input */}
              <div className="pos-checkout-row">
                <input
                  type="text"
                  placeholder="Customer name (optional)"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="pos-customer-input"
                />
              </div>

              {/* Payment Method */}
              <div className="pos-checkout-row">
                <div className="pos-payment-methods">
                  <button
                    className={`pos-payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash
                  </button>
                  <button
                    className={`pos-payment-btn ${paymentMethod === 'mobile_money' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('mobile_money')}
                  >
                    Mobile Money
                  </button>
                  <button
                    className={`pos-payment-btn ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank_transfer')}
                  >
                    Bank Transfer
                  </button>
                </div>
              </div>

              {/* Totals - NO VAT */}
              <div className="pos-totals">
                <div className="pos-total-row grand-total">
                  <span>Total</span>
                  <span>KES {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button 
                className="pos-pay-btn" 
                disabled={cart.length === 0 || processingCheckout}
                onClick={handleCheckout}
              >
                {processingCheckout ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} /> 
                    Pay KES {total.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}