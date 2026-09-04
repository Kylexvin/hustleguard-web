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
  PackageX,
  ChevronDown,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const cartRef = useRef(cart);
  const initialLoadDone = useRef(false);

  // Check mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close cart on desktop
  useEffect(() => {
    if (!isMobile) {
      setCartOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const toggleExpand = useCallback((productId) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  }, []);

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
    const baseUnit = product.sellUnits.find(u => u.isBase);
    return baseUnit || product.sellUnits[0];
  }, []);

  // ============================================================
  // Add to cart with UOM support
  // ============================================================
  const addToCart = useCallback((product, unitName = null, quantity = 1) => {
    const productData = products.find(p => p.productId === product.productId);
    if (!productData) {
      toast.error('Product not found');
      return;
    }

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
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              totalPrice: (item.quantity + quantity) * unitPrice,
              quantityInBase: (item.quantity + quantity) * unit.conversion
            }
          : item
      ));
      toast.success(`Added ${quantity} more ${unit.label}`);
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
      toast.success(`${productData.productName} (${unit.label}) added`);
      
      // Open cart on mobile when item is added
      if (isMobile) {
        setCartOpen(true);
      }
    }
  }, [products, getBestSellUnit, isMobile]);

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
  // Load initial products
  // ============================================================
  const loadInitialProducts = useCallback(async () => {
    if (initialLoadDone.current) return;
    
    try {
      setLoadingInitial(true);
      setError(null);
      const response = await axios.get('/products');

      if (response.data.success) {
        const posProducts = response.data.data.map(product => {
          const stock = product.stock || 0;
          
          return {
            productId: product._id,
            productName: product.name,
            description: product.description,
            category: product.category,
            baseUnit: product.units?.find(u => u.isBase) || { name: 'unit', label: 'Unit' },
            sellUnits: product.units || [],
            totalStock: stock,
            minStockAlert: product.minStockAlert || 5,
            isLowStock: stock > 0 && stock <= (product.minStockAlert || 5),
            isOutOfStock: stock <= 0,
            price: product.units?.find(u => u.isBase)?.sellPrice || 0,
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
  // Search products
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
          includeOutOfStock: false
        }
      });
      
      if (response.data.success) {
        const searchResults = response.data.data.map(product => ({
          productId: product._id,
          productName: product.name,
          description: product.description,
          category: product.category,
          baseUnit: product.units?.find(u => u.isBase) || { name: 'unit', label: 'Unit' },
          sellUnits: product.units || [],
          totalStock: product.stock || 0,
          minStockAlert: product.minStockAlert || 5,
          isLowStock: product.isLowStock || false,
          isOutOfStock: product.isOutOfStock || false,
          price: product.units?.find(u => u.isBase)?.sellPrice || 0,
          original: product
        }));
        setProducts(searchResults);
      }
    } catch (err) {
      console.error('Error searching products:', err);
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
  // Handle barcode scan
  // ============================================================
  const handleBarcodeScan = useCallback(async (barcode) => {
    if (!barcode || barcode.trim() === '') return;

    try {
      setBarcodeError(null);
      const response = await axios.get(`/pos/products/barcode/${barcode.trim()}`);

      if (response.data.success) {
        const product = response.data.data;
        const stock = product.stock || 0;
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
  // Open Payment Modal
  // ============================================================
  const openPaymentModal = useCallback(() => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
    setPaymentMethod('cash');
    setAmountPaid('');
    setPaymentError('');
  }, [cart.length]);

  // ============================================================
  // Process Payment
  // ============================================================
  const processPayment = useCallback(async () => {
    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const paidAmount = parseFloat(amountPaid);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }
    
    if (paidAmount < total) {
      setPaymentError(`Amount paid (${paidAmount}) is less than total (${total})`);
      return;
    }

    try {
      setProcessingCheckout(true);
      
      const saleItems = cart.map(item => ({
        productId: item.productId,
        unitName: item.unitName,
        quantity: item.quantity
      }));

      const saleData = {
        items: saleItems,
        customer: customer || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        amountPaid: paidAmount,
        notes: `POS Sale - ${new Date().toLocaleString()}`
      };

      const response = await axios.post('/sales', saleData);
      
      toast.success(`Sale complete! Total: KES ${total.toFixed(2)}`);
      
      await Swal.fire({
        title: 'Sale Complete!',
        html: `
          <div style="text-align: left;">
            <p><strong>Invoice:</strong> ${response.data.data?.invoiceNumber || 'N/A'}</p>
            <p><strong>Total:</strong> KES ${total.toFixed(2)}</p>
            <p><strong>Paid:</strong> KES ${paidAmount.toFixed(2)}</p>
            <p><strong>Change:</strong> KES ${(paidAmount - total).toFixed(2)}</p>
            <p><strong>Items:</strong> ${cart.length} products</p>
            <p><strong>Payment:</strong> ${paymentMethod}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      setCart([]);
      setCustomer('');
      setCustomerPhone('');
      setShowPaymentModal(false);
      setPaymentMethod('cash');
      setAmountPaid('');
      
      if (isMobile) {
        setCartOpen(false);
      }
      
      initialLoadDone.current = false;
      loadInitialProducts();
      
    } catch (err) {
      console.error('Error processing sale:', err);
      const errorMsg = err.response?.data?.message || 'Failed to process sale.';
      toast.error(errorMsg);
      setPaymentError(errorMsg);
    } finally {
      setProcessingCheckout(false);
    }
  }, [cart, customer, customerPhone, paymentMethod, amountPaid, loadInitialProducts, isMobile]);

  // ============================================================
  // Voice command processing
  // ============================================================
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
        openPaymentModal();
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
          removeFromCart(match.productId, existing.unitName);
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
  }, [products, cart, removeFromCart, addToCart, getBestSellUnit, openPaymentModal]);

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

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    handleBarcodeScan(barcodeInput);
  };

  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

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
  // RENDER CART CONTENT (reused for desktop and mobile)
  // ============================================================
  const renderCartContent = () => (
    <>
      <div className="pos-cart-header">
        <h3><ShoppingCart size={17} /> Cart</h3>
        <span className="pos-cart-count">{itemCount} units</span>
        {isMobile && (
          <button className="pos-cart-close" onClick={toggleCart}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="pos-cart-items">
        {cart.length === 0 ? (
          <div className="pos-empty-cart">
            <ShoppingCart size={30} />
            <p>No items in cart</p>
            <span>Search, scan, or tap a unit to add</span>
          </div>
        ) : (
          cart.map((item, index) => (
            <div key={`${item.productId}-${item.unitName}-${index}`} className="pos-cart-item">
              <div className="pos-cart-item-top">
                <span className="pos-cart-item-name">
                  {item.productName}
                  <span className="pos-cart-item-unit">{item.unitLabel}</span>
                </span>
                <button className="pos-cart-remove" onClick={() => removeFromCart(item.productId, item.unitName)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="pos-cart-item-bottom">
                <div className="pos-qty-group">
                  <button
                    className="pos-qty-btn"
                    onClick={() => updateQuantity(item.productId, item.unitName, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={13} />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="pos-qty-btn"
                    onClick={() => updateQuantity(item.productId, item.unitName, 1)}
                    disabled={item.quantity >= item.maxQuantity}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <span className="pos-cart-item-total">KES {item.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pos-checkout">
        <div className="pos-checkout-row">
          <input
            type="text"
            placeholder="Customer name (optional)"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="pos-input"
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="pos-input"
          />
        </div>

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

        <button
          className="pos-pay-btn"
          disabled={cart.length === 0 || processingCheckout}
          onClick={openPaymentModal}
        >
          <CreditCard size={18} /> Proceed to Payment
        </button>
      </div>
    </>
  );

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f2419',
            color: '#eafff3',
            borderRadius: '10px',
            padding: '12px 16px',
            border: '1px solid #1e4030'
          },
          success: {
            duration: 3000,
            iconTheme: { primary: '#34d399', secondary: '#0f2419' },
          },
          error: {
            duration: 4000,
            iconTheme: { primary: '#f87171', secondary: '#0f2419' },
          },
        }}
      />
      
      <div className="pos-container">
        {/* Left Column - Products */}
        <div className="pos-left">
          <div className="pos-header">
            <h2>Point of Sale</h2>
            <span className="pos-item-count">{itemCount} item{itemCount !== 1 ? 's' : ''} selected</span>
          </div>

          <div className="pos-search-bar">
            <div className="pos-search">
              <Search className="pos-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search products by name, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button className="pos-search-clear" onClick={() => setSearch('')}>
                  <X size={15} />
                </button>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'none' }}>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                id="barcode-scanner"
              />
            </form>

            <button
              className="pos-icon-btn"
              title="Scan barcode"
              onClick={() => document.getElementById('barcode-scanner')?.focus()}
            >
              <QrCode size={18} />
            </button>

            <button
              className={`pos-icon-btn pos-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice ordering'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening && <span className="pos-voice-pulse" />}
            </button>

            {/* Mobile Cart Toggle */}
            {isMobile && (
              <button className="pos-icon-btn pos-cart-toggle" onClick={toggleCart}>
                <ShoppingCart size={18} />
                {cart.length > 0 && <span className="pos-cart-badge">{cart.length}</span>}
              </button>
            )}
          </div>

          {barcodeError && (
            <div className="pos-inline-alert error">
              <TriangleAlert size={15} />
              <span>{barcodeError}</span>
            </div>
          )}

          {isListening && (
            <div className="pos-voice-status">
              <div className="pos-voice-indicator">
                <span className={`pos-voice-dot ${voiceStatus}`} />
                <span>
                  {voiceStatus === 'listening' && 'Listening... say a product name'}
                  {voiceStatus === 'confirmed' && 'Added to cart!'}
                  {voiceStatus === 'idle' && 'Ready...'}
                </span>
              </div>
              {voiceTranscript && (
                <div className="pos-voice-transcript">
                  <Volume2 size={13} />
                  <span>{voiceTranscript}</span>
                </div>
              )}
            </div>
          )}

          {!isListening && (
            <div className="pos-voice-help">
              <Mic size={13} />
              <span>Click the mic to order by voice</span>
              <button
                className="pos-voice-help-toggle"
                onClick={() => {
                  Swal.fire({
                    title: 'Voice Commands',
                    html: `<ul style="text-align:left;">${voiceCommands.map(c => `<li>${c}</li>`).join('')}</ul>`,
                    icon: 'info',
                    confirmButtonText: 'Got it',
                    confirmButtonColor: '#1a7f4e'
                  });
                }}
              >
                ?
              </button>
            </div>
          )}

          <div className="pos-products-scroll">
            {loadingInitial ? (
              <div className="pos-status-block">
                <LoaderCircle className="spin" size={26} />
                <span>Loading products...</span>
              </div>
            ) : searching ? (
              <div className="pos-status-block">
                <LoaderCircle className="spin" size={26} />
                <span>Searching...</span>
              </div>
            ) : error ? (
              <div className="pos-status-block error">
                <TriangleAlert size={22} />
                <span>{error}</span>
                <button onClick={() => setError(null)}>Dismiss</button>
              </div>
            ) : products.length === 0 ? (
              <div className="pos-status-block">
                <PackageX size={26} />
                <span>No products available</span>
                <small>Add products from the Products page</small>
              </div>
            ) : (
              <div className="pos-product-grid">
                {products.map((product) => {
                  const bestUnit = getBestSellUnit(product);
                  const isOutOfStock = product.totalStock <= 0;

                  const units = product.sellUnits && product.sellUnits.length > 0
                    ? product.sellUnits
                    : [{ ...bestUnit }];
                  const baseUnit = units.find(u => u.isBase) || units[0];
                  const otherUnits = units.filter(u => u !== baseUnit && u.name !== baseUnit.name);
                  const isExpanded = expandedProducts[product.productId];

                  const renderUnitBtn = (unit) => {
                    const availableInUnit = product.totalStock / unit.conversion;
                    const isAvailable = availableInUnit >= 1;
                    const price = unit.sellPrice || product.price || 0;

                    return (
                      <button
                        key={unit.name}
                        className={`pos-unit ${unit.isBase ? 'base' : ''} ${!isAvailable || isOutOfStock ? 'disabled' : ''}`}
                        onClick={() => {
                          if (!isAvailable || isOutOfStock) {
                            toast.error(`Only ${Math.floor(availableInUnit)} ${unit.label} available`);
                            return;
                          }
                          addToCart(product, unit.name, 1);
                        }}
                        disabled={!isAvailable || isOutOfStock}
                      >
                        <span className="pos-unit-label">{unit.label}</span>
                        <span className="pos-unit-price">KES {price}</span>
                      </button>
                    );
                  };

                  return (
                    <div
                      key={product.productId}
                      className={`pos-card ${isOutOfStock ? 'out' : ''}`}
                    >
                      <div className="pos-card-top">
                        <h4>{product.productName}</h4>
                        <span className={`pos-stock-pill ${product.isLowStock ? 'low' : ''} ${isOutOfStock ? 'out' : ''}`}>
                          {product.totalStock} {product.baseUnit?.label || 'units'}
                        </span>
                      </div>

                      <div className="pos-card-units">
                        <div className="pos-unit-row">
                          {renderUnitBtn(baseUnit)}
                          {otherUnits.length > 0 && (
                            <button
                              className={`pos-unit-toggle ${isExpanded ? 'open' : ''}`}
                              onClick={() => toggleExpand(product.productId)}
                              title="More units"
                            >
                              <ChevronDown size={14} />
                            </button>
                          )}
                        </div>
                        {isExpanded && otherUnits.length > 0 && (
                          <div className="pos-unit-more">
                            {otherUnits.map(renderUnitBtn)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Cart (Desktop) */}
        {!isMobile && (
          <div className="pos-right">
            <div className="pos-cart">
              {renderCartContent()}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Cart - Bottom Sheet */}
      {isMobile && (
        <>
          {/* Cart Overlay */}
          {cartOpen && <div className="pos-cart-overlay" onClick={toggleCart} />}
          
          {/* Cart Sheet */}
          <div className={`pos-cart-sheet ${cartOpen ? 'open' : ''}`}>
            <div className="pos-cart-sheet-handle">
              <div className="pos-cart-sheet-drag" />
            </div>
            <div className="pos-cart">
              {renderCartContent()}
            </div>
          </div>
        </>
      )}

      {/* ============================================================
          PAYMENT MODAL
          ============================================================ */}
      {showPaymentModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal">
            <div className="pos-modal-header">
              <h3>Payment</h3>
              <button className="pos-modal-close" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="pos-modal-body">
              {/* Cart Summary */}
              <div className="pos-modal-summary">
                <div className="pos-modal-totals">
                  <div className="pos-modal-total-row">
                    <span>Subtotal</span>
                    <span>KES {total.toFixed(2)}</span>
                  </div>
                  {cart.map((item, i) => (
                    <div key={i} className="pos-modal-item-row">
                      <span>{item.productName} × {item.quantity} {item.unitLabel}</span>
                      <span>KES {item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="pos-modal-total-row grand-total">
                    <span>Total</span>
                    <span>KES {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="pos-modal-payment">
                <label>Payment Method</label>
                <div className="pos-payment-methods">
                  {['cash', 'mpesa', 'bank', 'credit'].map((method) => (
                    <button
                      key={method}
                      className={`pos-payment-btn ${paymentMethod === method ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="pos-modal-amount">
                <label>Amount Paid</label>
                <input
                  type="number"
                  placeholder="Enter amount received"
                  value={amountPaid}
                  onChange={(e) => {
                    setAmountPaid(e.target.value);
                    setPaymentError('');
                  }}
                  className="pos-modal-input"
                  autoFocus
                />
                {paymentError && (
                  <div className="pos-modal-error">{paymentError}</div>
                )}
                {amountPaid && parseFloat(amountPaid) >= total && (
                  <div className="pos-modal-change">
                    Change: KES {(parseFloat(amountPaid) - total).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="pos-modal-footer">
              <button
                className="pos-modal-cancel"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="pos-modal-confirm"
                disabled={processingCheckout}
                onClick={processPayment}
              >
                {processingCheckout ? (
                  <><LoaderCircle className="spin" size={18} /> Processing...</>
                ) : (
                  <>Complete Payment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}