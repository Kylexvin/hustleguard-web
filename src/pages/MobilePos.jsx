// src/pages/MobilePos.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ShoppingCart,
  X,
  QrCode,
  Mic,
  MicOff,
  LoaderCircle,
  TriangleAlert,
  Package
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import './css/MobilePos.css';

export default function MobilePos() {
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartHeight, setCartHeight] = useState(60);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cartRef = useRef(cart);
  const cartStartY = useRef(0);
  const cartCurrentY = useRef(0);

  // Keep cartRef in sync
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Add to cart
  const addToCart = useCallback((product, unitName = null) => {
    const currentCart = cartRef.current;
    const existing = currentCart.find(item => item.productId === product.productId && item.unitName === (unitName || 'base'));

    if (existing) {
      if (existing.quantity >= product.availableStock) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(prev => prev.map(item =>
        item.productId === product.productId && item.unitName === (unitName || 'base')
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success(`Added another ${product.productName}`);
    } else {
      if (product.availableStock === 0) {
        toast.error('Product out of stock');
        return;
      }
      setCart(prev => [...prev, {
        productId: product.productId,
        productName: product.productName,
        unitName: unitName || 'base',
        unitLabel: product.unitLabel || 'Unit',
        conversion: product.conversion || 1,
        quantity: 1,
        price: product.unitPrice || product.sellingPrice || 0,
        availableStock: product.availableStock || 0,
        baseUnit: product.baseUnit || 'unit'
      }]);
      toast.success(`${product.productName} added to cart`);
    }
    
    if (currentCart.length === 0) {
      setIsCartOpen(true);
    }
  }, []);

  // Remove from cart
  const removeFromCart = useCallback((productId, unitName) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.unitName === unitName)));
    toast.success('Item removed');
    if (cart.length <= 1) {
      setIsCartOpen(false);
    }
  }, [cart.length]);

  // Update quantity
  const updateQuantity = useCallback((productId, unitName, change) => {
    const currentCart = cartRef.current;
    const item = currentCart.find(i => i.productId === productId && i.unitName === unitName);
    
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty > item.availableStock) {
      toast.error('Not enough stock');
      return;
    }
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => !(i.productId === productId && i.unitName === unitName)));
      toast.success('Item removed');
      if (cart.length <= 1) {
        setIsCartOpen(false);
      }
      return;
    }
    
    setCart(prev => prev.map(i =>
      i.productId === productId && i.unitName === unitName
        ? { ...i, quantity: newQty }
        : i
    ));
  }, [cart.length]);

  // Load initial products (using POS endpoint with units)
  const loadInitialProducts = useCallback(async () => {
    try {
      setLoadingInitial(true);
      setError(null);
      const response = await axios.get('/pos/products/search', {
        params: {
          limit: 50,
          includeOutOfStock: false,
          includeUnits: true
        }
      });
      
      if (response.data.success) {
        const posProducts = response.data.data.map(product => {
          // Get the best sell unit (prefer base unit or first available)
          const sellUnit = product.sellUnits?.find(u => u.isBase) || product.sellUnits?.[0];
          return {
            productId: product._id,
            productName: product.name,
            baseUnit: product.baseUnit,
            sellUnits: product.sellUnits || [],
            totalStock: product.totalStock || 0,
            isLowStock: product.isLowStock || false,
            isOutOfStock: product.isOutOfStock || false,
            // Primary unit info for quick add
            primaryUnit: sellUnit ? {
              name: sellUnit.name,
              label: sellUnit.label,
              conversion: sellUnit.conversion,
              price: sellUnit.sellPrice || 0,
              availableStock: sellUnit.availableStock || 0
            } : null
          };
        });
        setProducts(posProducts);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products.');
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
          includeOutOfStock: false,
          includeUnits: true
        }
      });
      
      if (response.data.success) {
        const posProducts = response.data.data.map(product => {
          const sellUnit = product.sellUnits?.find(u => u.isBase) || product.sellUnits?.[0];
          return {
            productId: product._id,
            productName: product.name,
            baseUnit: product.baseUnit,
            sellUnits: product.sellUnits || [],
            totalStock: product.totalStock || 0,
            isLowStock: product.isLowStock || false,
            isOutOfStock: product.isOutOfStock || false,
            primaryUnit: sellUnit ? {
              name: sellUnit.name,
              label: sellUnit.label,
              conversion: sellUnit.conversion,
              price: sellUnit.sellPrice || 0,
              availableStock: sellUnit.availableStock || 0
            } : null
          };
        });
        setProducts(posProducts);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Failed to search products.');
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

  // Get product by barcode (with unit info)
  const handleBarcodeScan = useCallback(async (barcode) => {
    if (!barcode || barcode.trim() === '') return;

    try {
      setBarcodeError(null);
      const response = await axios.get(`/pos/products/barcode/${barcode.trim()}`);
      
      if (response.data.success) {
        const product = response.data.data;
        
        // Find which unit was scanned
        const matchedUnit = product.matchedUnit || product.sellUnits?.[0];
        const unitName = matchedUnit?.name || 'base';
        const unitLabel = matchedUnit?.label || 'Unit';
        const conversion = matchedUnit?.conversion || 1;
        const sellPrice = matchedUnit?.sellPrice || matchedUnit?.price || 0;
        const availableStock = matchedUnit?.availableStock || product.totalStock || 0;

        addToCart({
          productId: product._id,
          productName: product.name,
          unitName: unitName,
          unitLabel: unitLabel,
          conversion: conversion,
          unitPrice: sellPrice,
          availableStock: availableStock,
          baseUnit: product.baseUnit
        }, unitName);
        
        setBarcodeInput('');
      }
    } catch (err) {
      console.error('Error scanning barcode:', err);
      setBarcodeError('Product not found');
      toast.error('Product not found');
      setTimeout(() => setBarcodeError(null), 3000);
    }
  }, [addToCart]);

  // Handle checkout - UPDATED for multi-item sales
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Build sale items
    const saleItems = cart.map(item => ({
      productId: item.productId,
      unitName: item.unitName,
      quantity: item.quantity
    }));

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
      
      // Single API call with all items
      const saleData = {
        items: saleItems,
        customer: customer || 'Walk-in Customer',
        customerPhone: '',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        amountPaid: total,
        notes: `POS Sale - ${new Date().toLocaleString()}`
      };

      console.log('Sending sale data:', saleData);
      const response = await axios.post('/sales', saleData);
      
      toast.success(`Sale complete! Total: KES ${total.toFixed(2)}`);
      
      await Swal.fire({
        title: 'Sale Complete!',
        html: `
          <div style="text-align: left;">
            <p><strong>Invoice:</strong> ${response.data.data?.invoiceNumber || 'N/A'}</p>
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
      setIsCartOpen(false);
      
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

  // Voice command processing (updated for new product structure)
  const processVoiceCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase().trim();
    
    if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('remove all')) {
      setCart([]);
      setVoiceStatus('confirmed');
      toast('Cart cleared');
      setIsCartOpen(false);
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
      const match = products.find(p => lower.includes(p.productName.toLowerCase()));
      if (match) {
        const existing = cart.find(item => item.productId === match.productId);
        if (existing) {
          if (existing.quantity > 1) {
            updateQuantity(match.productId, existing.unitName, -1);
          } else {
            removeFromCart(match.productId, existing.unitName);
          }
        } else {
          toast.error(`${match.productName} not in cart`);
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
      const pLower = p.productName.toLowerCase();
      const score = productName.split(' ').filter(word => 
        pLower.includes(word) || word.includes(pLower)
      ).length;
      
      if (score > matchedScore) {
        matchedScore = score;
        matchedProduct = p;
      }
    });

    if (matchedProduct && matchedScore > 0) {
      const unit = matchedProduct.primaryUnit;
      if (!unit) {
        toast.error(`No sell unit available for ${matchedProduct.productName}`);
        return;
      }
      
      if (unit.availableStock < quantity) {
        toast.error(`Only ${unit.availableStock} in stock`);
        quantity = unit.availableStock;
      }
      
      if (quantity > 0) {
        addToCart({
          productId: matchedProduct.productId,
          productName: matchedProduct.productName,
          unitName: unit.name,
          unitLabel: unit.label,
          conversion: unit.conversion,
          unitPrice: unit.price,
          availableStock: unit.availableStock,
          baseUnit: matchedProduct.baseUnit
        }, unit.name);
        
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
          } catch (e) {}
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

  // Calculate totals
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Drag to resize cart
  const handleTouchStart = (e) => {
    cartStartY.current = e.touches[0].clientY;
    cartCurrentY.current = cartHeight;
  };

  const handleTouchMove = (e) => {
    const deltaY = cartStartY.current - e.touches[0].clientY;
    const newHeight = Math.min(85, Math.max(30, cartCurrentY.current + (deltaY / window.innerHeight) * 100));
    setCartHeight(newHeight);
  };

  const handleTouchEnd = () => {
    if (cartHeight < 45) {
      setCartHeight(30);
    } else if (cartHeight < 65) {
      setCartHeight(60);
    } else {
      setCartHeight(85);
    }
  };

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
      
      <div className="mobile-pos">
        {/* Header */}
        <div className="mobile-pos-header">
          <div className="mobile-pos-header-left">
            <h2>POS</h2>
          </div>
          <div className="mobile-pos-header-right">
            <button 
              className="mobile-cart-btn"
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="mobile-cart-badge">{itemCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mobile-pos-search">
          <div className="mobile-pos-search-wrapper">
            <Search className="mobile-pos-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="mobile-pos-search-clear" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
          <div className="mobile-pos-search-actions">
            <form onSubmit={handleBarcodeSubmit} style={{ display: 'none' }}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                id="mobile-barcode-scanner"
              />
            </form>
            <button 
              className="mobile-scan-btn"
              onClick={() => document.getElementById('mobile-barcode-scanner')?.focus()}
            >
              <QrCode size={18} />
            </button>
            <button 
              className={`mobile-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening && <span className="mobile-voice-pulse"></span>}
            </button>
          </div>
        </div>

        {/* Voice Status */}
        {isListening && (
          <div className="mobile-voice-status">
            <div className="mobile-voice-indicator">
              <span className={`mobile-voice-dot ${voiceStatus}`}></span>
              <span className="mobile-voice-text">
                {voiceStatus === 'listening' && 'Listening...'}
                {voiceStatus === 'confirmed' && 'Added!'}
                {voiceStatus === 'idle' && 'Ready...'}
              </span>
            </div>
            {voiceTranscript && (
              <div className="mobile-voice-transcript">
                <span>"{voiceTranscript}"</span>
              </div>
            )}
          </div>
        )}

        {/* Barcode error */}
        {barcodeError && (
          <div className="mobile-barcode-error">
            <TriangleAlert size={16} />
            <span>{barcodeError}</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="mobile-pos-products">
          {loadingInitial ? (
            <div className="mobile-pos-loading">
              <LoaderCircle className="spin" size={24} />
              <span>Loading...</span>
            </div>
          ) : searching ? (
            <div className="mobile-pos-loading">
              <LoaderCircle className="spin" size={24} />
              <span>Searching...</span>
            </div>
          ) : error ? (
            <div className="mobile-pos-error">
              <TriangleAlert size={20} />
              <span>{error}</span>
            </div>
          ) : products.length === 0 ? (
            <div className="mobile-pos-empty">
              <Package size={32} />
              <p>No products</p>
              <span>Add products from Stock page</span>
            </div>
          ) : (
            products.map((product) => {
              const unit = product.primaryUnit;
              const price = unit?.price || 0;
              const stock = unit?.availableStock || product.totalStock || 0;
              const unitLabel = unit?.label || 'Unit';
              
              return (
                <div key={product.productId} className="mobile-product-card">
                  <div className="mobile-product-info">
                    <h4>{product.productName}</h4>
                    <div className="mobile-product-meta">
                      <span className="mobile-product-price">KES {price}</span>
                      <span className="mobile-product-stock">{stock} {unitLabel}s left</span>
                    </div>
                    {product.sellUnits && product.sellUnits.length > 1 && (
                      <div className="mobile-product-units">
                        {product.sellUnits.slice(0, 3).map((u, idx) => (
                          <button 
                            key={idx}
                            className="mobile-unit-btn"
                            onClick={() => {
                              const availableStock = u.availableStock || 0;
                              if (availableStock === 0) {
                                toast.error(`No stock in ${u.label}`);
                                return;
                              }
                              addToCart({
                                productId: product.productId,
                                productName: product.productName,
                                unitName: u.name,
                                unitLabel: u.label,
                                conversion: u.conversion,
                                unitPrice: u.sellPrice || 0,
                                availableStock: availableStock,
                                baseUnit: product.baseUnit
                              }, u.name);
                            }}
                            disabled={u.availableStock === 0}
                          >
                            {u.label}
                            {u.availableStock === 0 && ' (out)'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="mobile-add-btn"
                    onClick={() => {
                      if (unit) {
                        addToCart({
                          productId: product.productId,
                          productName: product.productName,
                          unitName: unit.name,
                          unitLabel: unit.label,
                          conversion: unit.conversion,
                          unitPrice: unit.price,
                          availableStock: unit.availableStock,
                          baseUnit: product.baseUnit
                        }, unit.name);
                      }
                    }}
                    disabled={product.isOutOfStock || !unit}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Bottom Sheet */}
        <div 
          className={`mobile-cart-sheet ${isCartOpen ? 'open' : ''}`}
          style={{ height: isCartOpen ? `${cartHeight}vh` : '0' }}
        >
          {/* Drag Handle */}
          <div 
            className="mobile-cart-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mobile-cart-handle-bar"></div>
            <div className="mobile-cart-handle-info">
              <span>{itemCount} items</span>
              <span className="mobile-cart-handle-total">KES {total.toFixed(2)}</span>
            </div>
            <button 
              className="mobile-cart-close"
              onClick={() => setIsCartOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="mobile-cart-items">
            {cart.length === 0 ? (
              <div className="mobile-cart-empty">
                <ShoppingCart size={32} />
                <p>Cart is empty</p>
                <span>Add items from the product list</span>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="mobile-cart-item">
                  <div className="mobile-cart-item-info">
                    <span className="mobile-cart-item-name">
                      {item.productName}
                      <span className="mobile-cart-item-unit"> ({item.unitLabel})</span>
                    </span>
                    <span className="mobile-cart-item-price">KES {item.price}</span>
                  </div>
                  <div className="mobile-cart-item-actions">
                    <button 
                      className="mobile-qty-btn minus"
                      onClick={() => updateQuantity(item.productId, item.unitName, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="mobile-cart-item-qty">{item.quantity}</span>
                    <button 
                      className="mobile-qty-btn plus"
                      onClick={() => updateQuantity(item.productId, item.unitName, 1)}
                      disabled={item.quantity >= item.availableStock}
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      className="mobile-cart-remove"
                      onClick={() => removeFromCart(item.productId, item.unitName)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout */}
          <div className="mobile-cart-checkout">
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mobile-customer-input"
            />
            
            <div className="mobile-payment-methods">
              <button
                className={`mobile-payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </button>
              <button
                className={`mobile-payment-btn ${paymentMethod === 'mobile_money' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mobile_money')}
              >
                M-Pesa
              </button>
              <button
                className={`mobile-payment-btn ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                Bank
              </button>
            </div>

            {/* Totals */}
            <div className="mobile-cart-totals">
              <div className="mobile-total-row grand-total">
                <span>Total</span>
                <span>KES {total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="mobile-pay-btn" 
              disabled={cart.length === 0 || processingCheckout}
              onClick={handleCheckout}
            >
              {processingCheckout ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} /> 
                  Pay KES {total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cart Overlay */}
        {isCartOpen && (
          <div 
            className="mobile-cart-overlay" 
            onClick={() => setIsCartOpen(false)}
          ></div>
        )}
      </div>
    </>
  );
}