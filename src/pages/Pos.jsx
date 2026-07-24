// src/pages/Pos.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faMinus, 
  faTrash, 
  faCreditCard, 
  faCashRegister,
  faTimes,
  faShoppingCart,
  faQrcode,
  faMicrophone,
  faMicrophoneSlash,
  faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import './css/Pos.css';

export default function Pos() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sample products - wrapped in useMemo to prevent re-creation on every render
  const products = useMemo(() => [
    { id: 1, name: 'Laptop Pro', price: 750, stock: 10 },
    { id: 2, name: 'Wireless Mouse', price: 35, stock: 50 },
    { id: 3, name: 'Smartphone X', price: 600, stock: 5 },
    { id: 4, name: 'USB Cable', price: 12, stock: 20 },
    { id: 5, name: 'Office Chair', price: 150, stock: 15 },
    { id: 6, name: 'Coffee Beans', price: 25, stock: 30 },
    { id: 7, name: 'Notebook', price: 8, stock: 40 },
    { id: 8, name: 'Pen Set', price: 5, stock: 60 },
  ], []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stock > 0
  );

  const speakResponse = useCallback((text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, change) => {
    setCart(prevCart => {
      const updated = prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(item => item !== null);
      return updated;
    });
  }, []);

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = total * 0.16;
    const grandTotal = total + tax;
    
    speakResponse(`Total is ${grandTotal.toFixed(2)} shillings. Proceeding to checkout.`);
    
    alert(`Checkout successful!\nTotal: KES ${grandTotal.toFixed(2)}\nItems: ${cart.length}`);
    
    setCart([]);
    setCustomer('');
  }, [cart, speakResponse]);

  const processVoiceCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase().trim();
    
    // Check for clear cart command
    if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('remove all')) {
      setCart([]);
      setVoiceStatus('confirmed');
      speakResponse('Cart cleared');
      setTimeout(() => setVoiceStatus('idle'), 1500);
      return;
    }

    // Check for checkout command
    if (lower.includes('checkout') || lower.includes('pay now') || lower.includes('complete sale')) {
      if (cart.length > 0) {
        handleCheckout();
      } else {
        speakResponse('Cart is empty');
      }
      return;
    }

    // Check for remove item command
    if (lower.includes('remove') || lower.includes('delete')) {
      const match = products.find(p => lower.includes(p.name.toLowerCase()));
      if (match) {
        const existing = cart.find(item => item.id === match.id);
        if (existing) {
          if (existing.quantity > 1) {
            updateQuantity(match.id, -1);
          } else {
            removeFromCart(match.id);
          }
          speakResponse(`Removed ${match.name}`);
        } else {
          speakResponse(`${match.name} not in cart`);
        }
      }
      return;
    }

    // Parse product quantities
    const words = lower.split(' ');
    let quantity = 1;
    let productName = '';
    
    // Try to find quantity (numbers or words)
    for (let i = 0; i < words.length; i++) {
      const num = parseInt(words[i]);
      if (!isNaN(num)) {
        quantity = num;
      } else if (['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].includes(words[i])) {
        const numMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
        quantity = numMap[words[i]] || 1;
      }
    }

    // Find product name (remove numbers and common words)
    const cleanWords = words.filter(w => 
      isNaN(w) && 
      !['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 
        'add', 'please', 'need', 'want', 'get', 'would', 'like', 'can', 'could', 'have', 
        'of', 'and', 'the', 'a', 'an'].includes(w)
    );
    productName = cleanWords.join(' ');

    // Find matching product
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

    // If we found a match and it's at least somewhat relevant
    if (matchedProduct && matchedScore > 0) {
      setCart(prevCart => {
        const existing = prevCart.find(item => item.id === matchedProduct.id);
        if (existing) {
          return prevCart.map(item => 
            item.id === matchedProduct.id 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          return [...prevCart, { ...matchedProduct, quantity: quantity }];
        }
      });
      
      setVoiceStatus('confirmed');
      speakResponse(`Added ${quantity} ${matchedProduct.name}`);
      
      setTimeout(() => {
        setVoiceStatus('idle');
        setVoiceTranscript('');
      }, 2000);
    } else if (productName.length > 3) {
      speakResponse(`Sorry, I couldn't find ${productName}`);
      setVoiceStatus('idle');
    }
  }, [cart, speakResponse, handleCheckout, updateQuantity, removeFromCart, products]);

  // Initialize speech recognition
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
          alert('Please allow microphone access to use voice features.');
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
      speakResponse('Listening for products');
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const tax = total * 0.16;
  const grandTotal = total + tax;

  const voiceCommands = [
    'Add [product name]',
    'Add 3 [product name]',
    'Remove [product name]',
    'Clear cart',
    'Checkout'
  ];

  return (
    <div className="pos-container">
      {/* Left Column - Products */}
      <div className="pos-left">
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
            autoFocus
          />
          <button 
            className={`pos-voice-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            title={isListening ? 'Stop listening' : 'Start voice ordering'}
          >
            <FontAwesomeIcon icon={isListening ? faMicrophoneSlash : faMicrophone} />
            {isListening && <span className="pos-voice-pulse"></span>}
          </button>
          <button className="pos-scan-btn" title="Scan barcode">
            <FontAwesomeIcon icon={faQrcode} />
          </button>
          {search && (
            <button className="pos-search-clear" onClick={() => setSearch('')}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {/* Voice Status */}
        {isListening && (
          <div className="pos-voice-status">
            <div className="pos-voice-indicator">
              <span className={`pos-voice-dot ${voiceStatus}`}></span>
              <span className="pos-voice-text">
                {voiceStatus === 'listening' && 'Listening... Speak product name'}
                {voiceStatus === 'confirmed' && '✅ Added to cart!'}
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
              alert(`Voice Commands:\n• ${voiceCommands.join('\n• ')}`);
            }}>
              ?
            </button>
          </div>
        )}

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
                  <div className="pos-product-meta">
                    <span className="pos-product-price">KES {product.price}</span>
                    <span className="pos-product-stock">{product.stock} left</span>
                  </div>
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
                <span>Speak or search to add items</span>
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
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <span className="pos-cart-item-qty">{item.quantity}</span>
                    <button 
                      className="pos-qty-btn plus"
                      onClick={() => updateQuantity(item.id, 1)}
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

          {/* Checkout */}
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
                  className={`pos-payment-btn ${paymentMethod === 'mpesa' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('mpesa')}
                >
                  M-Pesa
                </button>
                <button
                  className={`pos-payment-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  Card
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="pos-totals">
              <div className="pos-total-row">
                <span>Subtotal</span>
                <span>KES {total.toFixed(2)}</span>
              </div>
              <div className="pos-total-row">
                <span>Tax (16%)</span>
                <span>KES {tax.toFixed(2)}</span>
              </div>
              <div className="pos-total-row grand-total">
                <span>Total</span>
                <span>KES {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button 
              className="pos-pay-btn" 
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              <FontAwesomeIcon icon={faCreditCard} /> 
              Pay KES {grandTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}