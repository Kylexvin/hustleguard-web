// src/pages/Pos.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  X,
  ShoppingCart,
  QrCode,
  Mic,
  MicOff,
  Volume2,
  LoaderCircle,
  TriangleAlert,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import './css/Pos.css';

export default function Pos() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
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
  const [expandedProducts, setExpandedProducts] = useState({});

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cartRef = useRef(cart);
  const initialLoadDone = useRef(false);

  // Keep cartRef in sync with cart state
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // ============================================================
  // UOM: Get best sell unit for a product
  // ============================================================
  const getBestSellUnit = useCallback((product) => {
    if (!product.sellUnits || product.sellUnits.length === 0) {
      return {
        name: product.baseUnit?.name || 'unit',
        label: product.baseUnit?.label || 'Unit',
        conversion: 1,
        sellPrice: product.price || 0,
        isBase: true
      };
    }
    // Return first active sell unit (prefer base unit if available)
    const baseUnit = product.sellUnits.find(u => u.isBase);
    return baseUnit || product.sellUnits[0];
  }, []);

  // ============================================================
  // Add to cart with UOM support
  // ============================================================
  const addToCart = useCallback((product, unitName = null, quantity = 1) => {
    // Find the product
    const productData = products.find(p => p.productId === product.productId);
    if (!productData) {
      toast.error('Product not found');
      return;
    }

    // Find the unit
    let unit;
    if (unitName) {
      unit = productData.sellUnits?.find(u => u.name === unitName && u.isActive !== false);
    }
    if (!unit) {
      unit = getBestSellUnit(productData);
    }

    if (!unit) {
      toast.error('No sell unit available for this product');
      return;
    }

    // Check stock availability
    const availableInUnit = productData.totalStock / unit.conversion;
    const currentCart = cartRef.current;
    const existing = currentCart.find(item => 
      item.productId === product.productId && item.unitName === unit.name
    );

    const currentQty = existing ? existing.quantity : 0;
    const requestedQty = currentQty + quantity;

    if (requestedQty > availableInUnit) {
      toast.error(`Only ${Math.floor(availableInUnit)} ${unit.label} available`);
      return;
    }

    const unitPrice = unit.sellPrice || product.price || 0;

    if (existing) {
      setCart(prev => prev.map(item =>
        item.productId === product.productId && item.unitName === unit.name
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
      toast.success(`Added ${quantity} more ${unit.label} of ${productData.productName}`);
    } else {
      setCart(prev => [...prev, {
        productId: productData.productId,
        productName: productData.productName,
        baseUnit: productData.baseUnit,
        unitName: unit.name,
        unitLabel: unit.label,
        conversion: unit.conversion,
        quantity: quantity,
        price: unitPrice,
        totalPrice: unitPrice * quantity,
        quantityInBase: quantity * unit.conversion,
        availableStock: productData.totalStock,
        maxQuantity: Math.floor(availableInUnit)
      }]);
      toast.success(`${productData.productName} (${unit.label}) added to cart`);
    }
  }, [products, getBestSellUnit]);

  // ============================================================
  // Remove from cart
  // ============================================================
  const removeFromCart = useCallback((productId, unitName) => {
    setCart(prevCart => prevCart.filter(item => 
      !(item.productId === productId && item.unitName === unitName)
    ));
    toast.success('Item removed');
  }, []);

  // ============================================================
  // Update quantity
  // ============================================================
  const updateQuantity = useCallback((productId, unitName, change) => {
    const currentCart = cartRef.current;
    const item = currentCart.find(i => i.productId === productId && i.unitName === unitName);
    
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty > item.maxQuantity) {
      toast.error(`Only ${item.maxQuantity} ${item.unitLabel} available`);
      return;
    }
    if (newQty <= 0) {
      removeFromCart(productId, unitName);
      return;
    }
    
    setCart(prev => prev.map(i =>
      i.productId === productId && i.unitName === unitName
        ? { 
            ...i, 
            quantity: newQty, 
            totalPrice: newQty * i.price,
            quantityInBase: newQty * i.conversion
          }
        : i
    ));
  }, [removeFromCart]);

  // ============================================================
  // Load initial products (with UOM and stock)
  // ============================================================
  const loadInitialProducts = useCallback(async () => {
    if (initialLoadDone.current) return;
    
    try {
      setLoadingInitial(true);
      setError(null);
      const response = await axios.get('/products');

      if (response.data.success) {
        const posProducts = response.data.data.map(product => {
          const stock = product.totalStock || 0;
          
          return {
            productId: product._id,
            productName: product.name,
            description: product.description,
            category: product.category,
            baseUnit: product.baseUnit || { name: 'unit', label: 'Unit' },
            sellUnits: product.sellUnits || [],
            stockUnits: product.stockUnits || [],
            totalStock: stock,
            minStockAlert: product.minStockAlert || 5,
            isLowStock: stock > 0 && stock <= (product.minStockAlert || 5),
            isOutOfStock: stock <= 0,
            price: product.sellingPrice || 0,
            original: product
          };
        });
        setProducts(posProducts);
        initialLoadDone.current = true;
      } else {
        setError('Failed to load products. Please refresh.');
        toast.error('Failed to load products');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please refresh.');
      toast.error('Failed to load products');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  // ============================================================
  // Search products (with UOM)
  // ============================================================
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
        const searchResults = response.data.data.map(product => ({
          productId: product._id,
          productName: product.name,
          description: product.description,
          category: product.category,
          baseUnit: product.baseUnit || { name: 'unit', label: 'Unit' },
          sellUnits: product.sellUnits || [],
          stockUnits: product.stockUnits || [],
          totalStock: product.totalStock || 0,
          minStockAlert: product.minStockAlert || 5,
          isLowStock: product.isLowStock || false,
          isOutOfStock: product.isOutOfStock || false,
          price: product.sellUnits?.[0]?.sellPrice || 0,
          original: product
        }));
        setProducts(searchResults);
      }
    } catch (err) {
      console.error('Error searching products:', err);
      // Local fallback
      const localResults = products.filter(p => 
        p.productName.toLowerCase().includes(query.toLowerCase())
      );
      if (localResults.length > 0) {
        setProducts(localResults);
      } else {
        setError('Failed to search products.');
        toast.error('Failed to search products');
      }
    } finally {
      setSearching(false);
    }
  }, [loadInitialProducts, products]);

  // Load products on mount
  useEffect(() => {
    loadInitialProducts();
  }, [loadInitialProducts]);

  // Debounced search
  useEffect(() => {
    if (search.trim()) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchProducts(search);
      }, 300);
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, searchProducts]);

  // ============================================================
  // Handle barcode scan (searches across all units)
  // ============================================================
  const handleBarcodeScan = useCallback(async (barcode) => {
    if (!barcode || barcode.trim() === '') return;

    try {
      setBarcodeError(null);
      const response = await axios.get(`/pos/products/barcode/${barcode.trim()}`);

      if (response.data.success) {
        const product = response.data.data;
        const stock = product.totalStock || 0;
        
        // Find which unit was scanned
        const scannedUnit = product.matchedUnit || getBestSellUnit(product);
        
        addToCart({
          productId: product._id,
          productName: product.name,
          baseUnit: product.baseUnit,
          sellUnits: product.sellUnits,
          totalStock: stock
        }, scannedUnit?.name, 1);
        
        setBarcodeInput('');
      }
    } catch (err) {
      console.error('Error scanning barcode:', err);
      setBarcodeError('Product not found');
      toast.error('Product not found');
      setTimeout(() => setBarcodeError(null), 3000);
    }
  }, [addToCart, getBestSellUnit]);

  // ============================================================
  // Get product unit availability (for checkout validation)
  // ============================================================
  const checkUnitAvailability = useCallback(async (productId, unitName, quantity) => {
    try {
      const response = await axios.get(`/pos/products/${productId}/check-unit/${unitName}`, {
        params: { quantity }
      });
      return response.data.data;
    } catch (err) {
      return { isAvailable: false, error: err.response?.data?.message || 'Check failed' };
    }
  }, []);

  // ============================================================
  // Handle checkout (multi-item with UOM)
  // ============================================================
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Build sale items
    const saleItems = cart.map(item => ({
      productId: item.productId,
      unitName: item.unitName,
      quantity: item.quantity
    }));

    const result = await Swal.fire({
      title: 'Confirm Sale',
      html: `
        <div style="text-align: left; max-height: 300px; overflow-y: auto;">
          <p><strong>Items:</strong> ${cart.length} products</p>
          <p><strong>Total Units:</strong> ${itemCount}</p>
          <p><strong>Total:</strong> KES ${total.toFixed(2)}</p>
          <p><strong>Customer:</strong> ${customer || 'Walk-in'}</p>
          <p><strong>Payment:</strong> ${paymentMethod}</p>
          <hr style="margin: 10px 0;" />
          ${cart.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
              <span>${item.productName} (${item.unitLabel}) × ${item.quantity}</span>
              <span>KES ${item.totalPrice.toFixed(2)}</span>
            </div>
          `).join('')}
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
      
      const saleData = {
        items: saleItems,
        customer: customer || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        amountPaid: total,
        notes: `POS Sale - ${new Date().toLocaleString()}`
      };

      const response = await axios.post('/sales', saleData);
      
      toast.success(`Sale complete! Total: KES ${total.toFixed(2)}`);
      
      await Swal.fire({
        title: 'Sale Complete! 🎉',
        html: `
          <div style="text-align: left;">
            <p><strong>Invoice:</strong> ${response.data.data?.invoiceNumber || 'N/A'}</p>
            <p><strong>Total:</strong> KES ${total.toFixed(2)}</p>
            <p><strong>Items:</strong> ${cart.length} products (${itemCount} units)</p>
            <p><strong>Customer:</strong> ${customer || 'Walk-in'}</p>
            <p><strong>Payment:</strong> ${paymentMethod}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      setCart([]);
      setCustomer('');
      setCustomerPhone('');
      
      // Reload products to update stock
      initialLoadDone.current = false;
      loadInitialProducts();
      
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
  }, [cart, customer, customerPhone, paymentMethod, loadInitialProducts]);

  // ============================================================
  // Toggle product units expand
  // ============================================================
  const toggleProductExpand = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // ============================================================
  // Voice command processing (updated with UOM)
  // ============================================================
  const processVoiceCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase().trim();
    
    // Clear cart
    if (lower.includes('clear cart') || lower.includes('empty cart') || lower.includes('remove all')) {
      setCart([]);
      setVoiceStatus('confirmed');
      toast('Cart cleared');
      setTimeout(() => setVoiceStatus('idle'), 1500);
      return;
    }

    // Checkout
    if (lower.includes('checkout') || lower.includes('pay now') || lower.includes('complete sale')) {
      if (cart.length > 0) {
        handleCheckout();
      } else {
        toast.error('Cart is empty');
      }
      return;
    }

    // Remove
    if (lower.includes('remove') || lower.includes('delete')) {
      const match = products.find(p => lower.includes(p.productName.toLowerCase()));
      if (match) {
        const existing = cart.find(item => item.productId === match.productId);
        if (existing) {
          removeFromCart(match.productId, existing.unitName);
        } else {
          toast.error(`${match.productName} not in cart`);
        }
      }
      return;
    }

    // Add product with quantity
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
        'of', 'and', 'the', 'a', 'an', 'some', 'more'].includes(w)
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
      const bestUnit = getBestSellUnit(matchedProduct);
      const availableInUnit = matchedProduct.totalStock / bestUnit.conversion;
      
      if (availableInUnit < quantity) {
        toast.error(`Only ${Math.floor(availableInUnit)} ${bestUnit.label} available`);
        quantity = Math.floor(availableInUnit);
      }
      
      if (quantity > 0) {
        addToCart(matchedProduct, bestUnit.name, quantity);
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
  }, [products, cart, handleCheckout, removeFromCart, addToCart, getBestSellUnit]);

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
      toast.success('Listening... Speak product name');
    }
  };

  // Handle barcode submit
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    handleBarcodeScan(barcodeInput);
  };

  // Calculate totals
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const voiceCommands = [
    'Add [product name]',
    'Add 3 [product name]',
    'Remove [product name]',
    'Clear cart',
    'Checkout'
  ];

  // ============================================================
  // Render
  // ============================================================
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
            <Search className="pos-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search products by name, barcode..."
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
              <QrCode size={18} />
            </button>
            
            <button 
              className={`pos-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice ordering'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening && <span className="pos-voice-pulse"></span>}
            </button>
            
            {search && (
              <button className="pos-search-clear" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Barcode error */}
          {barcodeError && (
            <div className="pos-barcode-error">
              <TriangleAlert size={16} />
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
                  <Volume2 size={14} />
                  <span>"{voiceTranscript}"</span>
                </div>
              )}
            </div>
          )}

          {/* Voice Help */}
          {!isListening && (
            <div className="pos-voice-help">
              <Mic size={14} />
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
              <LoaderCircle className="spin" size={24} />
              <span>Loading products...</span>
            </div>
          ) : searching ? (
            <div className="pos-loading">
              <LoaderCircle className="spin" size={24} />
              <span>Searching...</span>
            </div>
          ) : error ? (
            <div className="pos-error">
              <TriangleAlert size={20} />
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
            {products.map((product) => {
              const bestUnit = getBestSellUnit(product);
              const isExpanded = expandedProducts[product.productId];
              const hasMultipleUnits = product.sellUnits && product.sellUnits.length > 1;
              
              return (
                <div key={product.productId} className="pos-product-card">
                  <div className="pos-product-info">
                    <h4>{product.productName}</h4>
                    <div className="pos-product-meta">
                      <span className="pos-product-price">
                        KES {bestUnit?.sellPrice || product.price || 0}
                      </span>
                      <span className={`pos-product-stock ${product.isLowStock ? 'low' : ''} ${product.isOutOfStock ? 'out' : ''}`}>
                        {product.totalStock} {product.baseUnit?.label || 'units'} left
                      </span>
                      {product.isLowStock && !product.isOutOfStock && (
                        <span className="pos-stock-warning">Low</span>
                      )}
                    </div>
                    {product.sellUnits && product.sellUnits.length > 0 && (
                      <div className="pos-product-units">
                        <span className="pos-unit-label">
                          {bestUnit?.label || 'Unit'}
                          {hasMultipleUnits && (
                            <button 
                              className="pos-unit-toggle"
                              onClick={() => toggleProductExpand(product.productId)}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              <span className="pos-unit-count">
                                +{product.sellUnits.length - 1} more
                              </span>
                            </button>
                          )}
                        </span>
                      </div>
                    )}
                    {isExpanded && hasMultipleUnits && (
                      <div className="pos-unit-list">
                        {product.sellUnits.filter(u => !u.isBase).map(unit => (
                          <button
                            key={unit.name}
                            className="pos-unit-btn"
                            onClick={() => {
                              const availableInUnit = product.totalStock / unit.conversion;
                              if (availableInUnit < 1) {
                                toast.error(`Only ${Math.floor(availableInUnit)} ${unit.label} available`);
                                return;
                              }
                              addToCart(product, unit.name, 1);
                            }}
                            disabled={product.totalStock / unit.conversion < 1}
                          >
                            {unit.label}
                            <span className="pos-unit-price">KES {unit.sellPrice}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="pos-add-btn"
                    onClick={() => {
                      const best = getBestSellUnit(product);
                      const availableInUnit = product.totalStock / best.conversion;
                      if (availableInUnit < 1) {
                        toast.error(`Only ${Math.floor(availableInUnit)} ${best.label} available`);
                        return;
                      }
                      addToCart(product, best.name, 1);
                    }}
                    disabled={product.isOutOfStock}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="pos-right">
          <div className="pos-cart">
            {/* Cart Header */}
            <div className="pos-cart-header">
              <h3>
                <ShoppingCart size={18} /> Cart
              </h3>
              <span className="pos-cart-count">{itemCount} units</span>
            </div>

            {/* Cart Items */}
            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-empty-cart">
                  <ShoppingCart size={32} />
                  <p>No items in cart</p>
                  <span>Search, scan, or speak to add items</span>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.productId}-${item.unitName}-${index}`} className="pos-cart-item">
                    <div className="pos-cart-item-info">
                      <span className="pos-cart-item-name">
                        {item.productName}
                        <span className="pos-cart-item-unit">({item.unitLabel})</span>
                      </span>
                      <span className="pos-cart-item-price">KES {item.price}</span>
                    </div>
                    <div className="pos-cart-item-actions">
                      <button 
                        className="pos-qty-btn minus"
                        onClick={() => updateQuantity(item.productId, item.unitName, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="pos-cart-item-qty">{item.quantity}</span>
                      <button 
                        className="pos-qty-btn plus"
                        onClick={() => updateQuantity(item.productId, item.unitName, 1)}
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        className="pos-cart-remove"
                        onClick={() => removeFromCart(item.productId, item.unitName)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="pos-cart-item-base">
                      <span className="pos-cart-item-conversion">
                        {item.quantityInBase} {item.baseUnit?.label || 'units'}
                      </span>
                      <span className="pos-cart-item-total">
                        KES {item.totalPrice.toFixed(2)}
                      </span>
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
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pos-customer-input"
                  style={{ width: '45%' }}
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
                    className={`pos-payment-btn ${paymentMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    Bank
                  </button>
                  <button
                    className={`pos-payment-btn ${paymentMethod === 'credit' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    Credit
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="pos-totals">
                <div className="pos-total-row">
                  <span>Items</span>
                  <span>{cart.length} products ({itemCount} units)</span>
                </div>
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
        </div>
      </div>
    </>
  );
}