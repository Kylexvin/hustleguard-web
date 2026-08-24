// src/pages/AddProduct.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSave, 
  faTag,
  faStore,
  faExclamationTriangle,
  faSpinner,
  faPlus,
  faTimes,
  faCheck,
  faTrash,
  faEdit,
  faInfoCircle,
  faCheckCircle,
  faChevronRight,
  faGripLines,
  faShoppingCart,
  faWarehouse,
  faBoxes
} from '@fortawesome/free-solid-svg-icons';
import './css/AddProduct.css';

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeStep, setActiveStep] = useState(1);

  // ============================================================
  // Product Data with UOM
  // ============================================================
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    baseUnit: { name: '', label: '' },
    sellUnits: [],
    stockUnits: [],
    minStockAlert: 5,
    supplier: '',
    supplierPrice: '',
    isActive: true
  });

  // ============================================================
  // Initial Stock Data
  // ============================================================
  const [initialStock, setInitialStock] = useState({
    unitName: '',
    quantity: '',
    buyPrice: '',
    batchNumber: '',
    supplier: ''
  });

  // ============================================================
  // UI Helpers
  // ============================================================
  const getInitialUnit = () => ({
    name: '',
    label: '',
    conversion: 1,
    isBase: false,
    buyPrice: 0,
    sellPrice: 0,
    barcode: '',
    isActive: true
  });

  const [newSellUnit, setNewSellUnit] = useState(getInitialUnit());
  const [newStockUnit, setNewStockUnit] = useState(getInitialUnit());
  const [editingSellUnitIndex, setEditingSellUnitIndex] = useState(null);
  const [editingStockUnitIndex, setEditingStockUnitIndex] = useState(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);

  // ============================================================
  // Steps Configuration (4 steps now)
  // ============================================================
  const steps = [
    { id: 1, label: 'Basic Info', icon: faTag },
    { id: 2, label: 'Sell Units', icon: faShoppingCart },
    { id: 3, label: 'Stock Units', icon: faWarehouse },
    { id: 4, label: 'Settings & Stock', icon: faBoxes }
  ];

  const isStepValid = (stepId) => {
    switch(stepId) {
      case 1:
        return formData.name.trim() !== '' && formData.category !== '';
      case 2:
        return formData.sellUnits.length > 0 && formData.sellUnits.some(u => u.isBase);
      case 3:
        return formData.stockUnits.length > 0 && formData.stockUnits.some(u => u.isBase);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getStepStatus = (stepId) => {
    if (stepId < activeStep && isStepValid(stepId)) return 'completed';
    if (stepId === activeStep) return 'active';
    return 'pending';
  };

  // ============================================================
  // Fetch categories
  // ============================================================
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/products');
      const products = response.data.data || [];
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      
      if (uniqueCategories.length === 0) {
        setCategories([
          'Electronics', 'Clothing', 'Food', 'Beverages', 
          'Health', 'Beauty', 'Home', 'Sports', 'Toys', 'Books', 'Other'
        ]);
      } else {
        setCategories(uniqueCategories);
      }
    } catch (err) {
      setCategories([
        'Electronics', 'Clothing', 'Food', 'Beverages', 
        'Health', 'Beauty', 'Home', 'Sports', 'Toys', 'Books', 'Other'
      ]);
    }
  };

  // ============================================================
  // Fetch product for editing
  // ============================================================
  const fetchProduct = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const response = await axios.get(`/products/${id}`);
      const product = response.data.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        baseUnit: product.baseUnit || { name: '', label: '' },
        sellUnits: product.sellUnits || [],
        stockUnits: product.stockUnits || [],
        minStockAlert: product.minStockAlert || 5,
        supplier: product.supplier || '',
        supplierPrice: product.supplierPrice || '',
        isActive: product.isActive !== undefined ? product.isActive : true
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product data. Please try again.');
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [isEditing, fetchProduct]);

  // ============================================================
  // Navigation
  // ============================================================
  const nextStep = () => {
    if (!isStepValid(activeStep)) {
      const stepNames = {
        1: 'Please fill in Basic Information',
        2: 'Please add at least one Sell Unit',
        3: 'Please add at least one Stock Unit',
        4: 'Settings are complete'
      };
      Swal.fire({
        title: 'Complete This Step',
        text: stepNames[activeStep] || 'Please complete all required fields',
        icon: 'info',
        confirmButtonColor: '#1B4D3D'
      });
      return;
    }

    if (activeStep < 4) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // ============================================================
  // Form handlers
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  // ============================================================
  // Initial Stock handlers
  // ============================================================
  const handleInitialStockChange = (e) => {
    const { name, value } = e.target;
    setInitialStock(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================================
  // Sell Units - First unit auto-sets base unit name
  // ============================================================
  const addSellUnit = () => {
    if (!newSellUnit.name) {
      setError('Unit name is required');
      return;
    }
    if (newSellUnit.conversion <= 0) {
      setError('Conversion must be greater than 0');
      return;
    }

    if (formData.sellUnits.some(u => u.name === newSellUnit.name)) {
      setError(`Unit "${newSellUnit.name}" already exists`);
      return;
    }

    const isBase = formData.sellUnits.length === 0 ? true : newSellUnit.isBase;

    // If this is the first unit, auto-set the base unit
    if (formData.sellUnits.length === 0) {
      setFormData(prev => ({
        ...prev,
        baseUnit: {
          name: newSellUnit.name,
          label: newSellUnit.label || newSellUnit.name
        }
      }));
    }

    if (editingSellUnitIndex !== null) {
      const updated = [...formData.sellUnits];
      updated[editingSellUnitIndex] = { ...newSellUnit, isBase };
      setFormData(prev => ({ ...prev, sellUnits: updated }));
      setEditingSellUnitIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        sellUnits: [...prev.sellUnits, { ...newSellUnit, isBase }]
      }));
    }

    setNewSellUnit(getInitialUnit());
    setShowSellForm(false);
    setError(null);
    Swal.fire({
      title: 'Unit Added',
      text: `"${newSellUnit.label || newSellUnit.name}" added to sell units`,
      icon: 'success',
      timer: 1200,
      showConfirmButton: false
    });
  };

  const editSellUnit = (index) => {
    setNewSellUnit({ ...formData.sellUnits[index] });
    setEditingSellUnitIndex(index);
    setShowSellForm(true);
  };

  const removeSellUnit = (index) => {
    const unit = formData.sellUnits[index];
    if (unit.isBase) {
      setError('Cannot remove the base unit');
      return;
    }
    setFormData(prev => ({
      ...prev,
      sellUnits: prev.sellUnits.filter((_, i) => i !== index)
    }));
  };

  // ============================================================
  // Stock Units - First unit auto-sets base unit if not already set
  // ============================================================
  const addStockUnit = () => {
    if (!newStockUnit.name) {
      setError('Unit name is required');
      return;
    }
    if (newStockUnit.conversion <= 0) {
      setError('Conversion must be greater than 0');
      return;
    }

    if (formData.stockUnits.some(u => u.name === newStockUnit.name)) {
      setError(`Unit "${newStockUnit.name}" already exists`);
      return;
    }

    const isBase = formData.stockUnits.length === 0 ? true : newStockUnit.isBase;

    // If base unit is not set, auto-set it from this stock unit
    if (!formData.baseUnit.name && formData.stockUnits.length === 0) {
      setFormData(prev => ({
        ...prev,
        baseUnit: {
          name: newStockUnit.name,
          label: newStockUnit.label || newStockUnit.name
        }
      }));
    }

    if (editingStockUnitIndex !== null) {
      const updated = [...formData.stockUnits];
      updated[editingStockUnitIndex] = { ...newStockUnit, isBase };
      setFormData(prev => ({ ...prev, stockUnits: updated }));
      setEditingStockUnitIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        stockUnits: [...prev.stockUnits, { ...newStockUnit, isBase }]
      }));
    }

    setNewStockUnit(getInitialUnit());
    setShowStockForm(false);
    setError(null);
    Swal.fire({
      title: 'Unit Added',
      text: `"${newStockUnit.label || newStockUnit.name}" added to stock units`,
      icon: 'success',
      timer: 1200,
      showConfirmButton: false
    });
  };

  const editStockUnit = (index) => {
    setNewStockUnit({ ...formData.stockUnits[index] });
    setEditingStockUnitIndex(index);
    setShowStockForm(true);
  };

  const removeStockUnit = (index) => {
    const unit = formData.stockUnits[index];
    if (unit.isBase) {
      setError('Cannot remove the base unit');
      return;
    }
    setFormData(prev => ({
      ...prev,
      stockUnits: prev.stockUnits.filter((_, i) => i !== index)
    }));
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // --- VALIDATION ---
      if (!formData.name || !formData.name.trim()) {
        setError('Product name is required.');
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setError('Please select a category.');
        setLoading(false);
        return;
      }

      if (!formData.baseUnit.name) {
        setError('Please add a sell unit first to set the base unit.');
        setLoading(false);
        return;
      }

      if (formData.sellUnits.length === 0) {
        setError('Please add at least one sell unit.');
        setLoading(false);
        return;
      }

      if (formData.stockUnits.length === 0) {
        setError('Please add at least one stock unit.');
        setLoading(false);
        return;
      }

      const hasSellBase = formData.sellUnits.some(u => u.isBase);
      if (!hasSellBase) {
        setError('Please mark one sell unit as the base unit.');
        setLoading(false);
        return;
      }

      const hasStockBase = formData.stockUnits.some(u => u.isBase);
      if (!hasStockBase) {
        setError('Please mark one stock unit as the base unit.');
        setLoading(false);
        return;
      }

      // --- PREPARE PRODUCT DATA ---
      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        category: formData.category,
        baseUnit: formData.baseUnit,
        sellUnits: formData.sellUnits.map(u => ({
          ...u,
          buyPrice: u.buyPrice || 0,
          sellPrice: u.sellPrice || 0
        })),
        stockUnits: formData.stockUnits.map(u => ({
          ...u,
          buyPrice: u.buyPrice || 0,
          sellPrice: u.sellPrice || 0
        })),
        minStockAlert: formData.minStockAlert || 5,
        supplier: formData.supplier || '',
        supplierPrice: formData.supplierPrice ? parseFloat(formData.supplierPrice) : 0,
        isActive: formData.isActive
      };

      // Legacy fields
      const baseSell = productData.sellUnits.find(u => u.isBase);
      const baseStock = productData.stockUnits.find(u => u.isBase);
      productData.sellingPrice = baseSell?.sellPrice || 0;
      productData.buyingPrice = baseStock?.buyPrice || 0;
      productData.unit = formData.baseUnit.name;
      productData.quantity = 0;

      // --- CREATE PRODUCT ---
      let response;
      let productId;

      if (isEditing) {
        response = await axios.put(`/products/${id}`, productData);
        productId = id;
      } else {
        response = await axios.post('/products', productData);
        productId = response.data.data._id;
      }

      const productName = formData.name;

      // --- ADD INITIAL STOCK (if provided) ---
      let stockAdded = false;
      let stockMessage = '';

      if (initialStock.unitName && initialStock.quantity && initialStock.buyPrice) {
        try {
          await axios.post(`/products/${productId}/stock`, {
            unitName: initialStock.unitName,
            quantity: parseFloat(initialStock.quantity),
            buyPrice: parseFloat(initialStock.buyPrice),
            batchNumber: initialStock.batchNumber || `INITIAL-${Date.now()}`,
            supplier: initialStock.supplier || formData.supplier || 'Initial Stock'
          });
          stockAdded = true;
          stockMessage = `Added ${initialStock.quantity} ${initialStock.unitName} as initial stock.`;
        } catch (stockErr) {
          console.warn('Failed to add initial stock:', stockErr);
          stockMessage = 'Product created, but initial stock failed. Add stock later from the Stock page.';
        }
      } else {
        stockMessage = 'No initial stock added. Add stock later from the Stock page.';
      }

      // --- SUCCESS DIALOG ---
      const successHtml = `
        <div style="text-align: left;">
          <p><strong>"${productName}"</strong> ${isEditing ? 'updated' : 'added'} successfully!</p>
          <hr style="margin: 10px 0;" />
          <p style="font-size: 14px;">${stockMessage}</p>
          ${stockAdded ? `<p style="font-size: 13px; color: #1B4D3D;">You can now sell this product in POS.</p>` : ''}
        </div>
      `;

      await Swal.fire({
        title: isEditing ? 'Product Updated' : 'Product Added',
        html: successHtml,
        icon: 'success',
        showCancelButton: !isEditing,
        confirmButtonColor: '#1B4D3D',
        cancelButtonColor: '#6c757d',
        confirmButtonText: isEditing ? 'View Products' : 'Add Another Product',
        cancelButtonText: 'View Products'
      }).then((result) => {
        if (!isEditing && result.isConfirmed) {
          // Reset everything for a new product
          setFormData({
            name: '',
            description: '',
            category: '',
            baseUnit: { name: '', label: '' },
            sellUnits: [],
            stockUnits: [],
            minStockAlert: 5,
            supplier: '',
            supplierPrice: '',
            isActive: true
          });
          setInitialStock({
            unitName: '',
            quantity: '',
            buyPrice: '',
            batchNumber: '',
            supplier: ''
          });
          setNewSellUnit(getInitialUnit());
          setNewStockUnit(getInitialUnit());
          setActiveStep(1);
          setShowSellForm(false);
          setShowStockForm(false);
          document.querySelector('input[name="name"]')?.focus();
        } else {
          navigate('/products');
        }
      });

    } catch (err) {
      console.error('Error saving product:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save product.';
      setError(errorMsg);
      Swal.fire({
        title: 'Error',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  if (fetching) {
    return (
      <div className="add-product-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      {/* Header */}
      <div className="add-product-header">
        <button className="add-product-back" onClick={() => navigate('/products')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2>{isEditing ? 'Edit Product' : 'Add Product'}</h2>
        <div className="add-product-header-spacer"></div>
      </div>

      {/* Progress Steps - Now 4 steps */}
      <div className="add-product-steps">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <button
              key={step.id}
              className={`add-product-step ${status}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="add-product-step-indicator">
                {status === 'completed' ? (
                  <FontAwesomeIcon icon={faCheckCircle} className="step-icon completed" />
                ) : status === 'active' ? (
                  <div className="step-number active">{step.id}</div>
                ) : (
                  <div className="step-number pending">{step.id}</div>
                )}
              </div>
              <span className="add-product-step-label">{step.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="add-product-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-product-form" noValidate>
        {/* ============================================================
        STEP 1: Basic Information
        ============================================================ */}
        {activeStep === 1 && (
          <div className="add-product-step-content">
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faTag} /> Basic Information
              </h3>
              <p className="add-product-hint">
                Tell us about your product. These are the basics.
              </p>
              
              <div className="add-product-field">
                <label>Product Name *</label>
                <div className="add-product-input-wrapper">
                  <FontAwesomeIcon icon={faTag} className="add-product-input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g., Sugar, Soda, Cooking Oil"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="add-product-field">
                <label>Category *</label>
                <div className="add-product-input-wrapper">
                  <FontAwesomeIcon icon={faStore} className="add-product-input-icon" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="add-product-field">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Briefly describe your product (optional)"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              {/* Show base unit if already set */}
              {formData.baseUnit.name && (
                <div className="add-product-base-unit-display">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    Base unit will be: <strong>{formData.baseUnit.label || formData.baseUnit.name}</strong>
                    {' '}(set automatically from your first sell unit)
                  </span>
                </div>
              )}
            </div>

            <div className="add-product-nav">
              <button type="button" className="add-product-nav-next" onClick={nextStep}>
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
        STEP 2: Sell Units
        ============================================================ */}
        {activeStep === 2 && (
          <div className="add-product-step-content">
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faShoppingCart} /> Sell Units
              </h3>
              <p className="add-product-hint">
                These are the units customers can buy in.
                <br />The <strong>first unit you add</strong> will set the base unit.
              </p>

              {/* Show current base unit */}
              {formData.baseUnit.name && (
                <div className="add-product-base-unit-display">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>
                    Base unit: <strong>{formData.baseUnit.label || formData.baseUnit.name}</strong>
                  </span>
                </div>
              )}

              {/* Existing sell units */}
              <div className="add-product-unit-list">
                {formData.sellUnits.length === 0 ? (
                  <div className="add-product-unit-empty">
                    <p>No sell units added yet</p>
                    <span>Click "Add Unit" below to get started</span>
                  </div>
                ) : (
                  formData.sellUnits.map((unit, index) => (
                    <div key={index} className="add-product-unit-item">
                      <div className="add-product-unit-info">
                        <span className="add-product-unit-name">
                          {unit.isBase && <span className="add-product-base-badge">Base</span>}
                          {unit.label || unit.name}
                        </span>
                        <span className="add-product-unit-detail">
                          {unit.conversion} × {formData.baseUnit.label || formData.baseUnit.name}
                        </span>
                        <span className="add-product-unit-price">KES {unit.sellPrice || 0}</span>
                        {unit.barcode && (
                          <span className="add-product-unit-barcode">{unit.barcode}</span>
                        )}
                      </div>
                      <div className="add-product-unit-actions">
                        <button type="button" onClick={() => editSellUnit(index)}>
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button type="button" onClick={() => removeSellUnit(index)} disabled={unit.isBase}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Unit Button */}
              {!showSellForm && (
                <button type="button" className="add-product-unit-toggle" onClick={() => setShowSellForm(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Add Sell Unit
                </button>
              )}

              {/* Add/edit sell unit form */}
              {showSellForm && (
                <div className="add-product-unit-form">
                  <div className="add-product-unit-form-header">
                    <span>{editingSellUnitIndex !== null ? 'Edit Sell Unit' : 'Add Sell Unit'}</span>
                    <button type="button" onClick={() => { setShowSellForm(false); setEditingSellUnitIndex(null); setNewSellUnit(getInitialUnit()); }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Unit Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., kg, 500g, crate"
                        value={newSellUnit.name}
                        onChange={(e) => setNewSellUnit({ ...newSellUnit, name: e.target.value })}
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Label</label>
                      <input
                        type="text"
                        placeholder="e.g., Kilogram, 500 Grams"
                        value={newSellUnit.label}
                        onChange={(e) => setNewSellUnit({ ...newSellUnit, label: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Conversion (per base) *</label>
                      <input
                        type="number"
                        placeholder="e.g., 1, 0.5, 24"
                        value={newSellUnit.conversion}
                        onChange={(e) => setNewSellUnit({ ...newSellUnit, conversion: parseFloat(e.target.value) || 0 })}
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Sell Price (KES)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newSellUnit.sellPrice}
                        onChange={(e) => setNewSellUnit({ ...newSellUnit, sellPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Barcode</label>
                      <input
                        type="text"
                        placeholder="Barcode for this unit"
                        value={newSellUnit.barcode}
                        onChange={(e) => setNewSellUnit({ ...newSellUnit, barcode: e.target.value })}
                      />
                    </div>
                    
                    {/* Is Base Unit - Only show if no units exist yet */}
                    {formData.sellUnits.length === 0 ? (
                      <div className="add-product-field half">
                        <label className="add-product-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newSellUnit.isBase}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setFormData(prev => ({
                                  ...prev,
                                  sellUnits: prev.sellUnits.map(u => ({ ...u, isBase: false }))
                                }));
                              }
                              setNewSellUnit({ ...newSellUnit, isBase: isChecked });
                            }}
                          />
                          This is the base unit
                          <span className="add-product-label-hint">(Required)</span>
                        </label>
                      </div>
                    ) : (
                      <div className="add-product-field half">
                        <div className="add-product-unit-base-info">
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span>Base unit already set</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="button" className="add-product-unit-add" onClick={addSellUnit}>
                    <FontAwesomeIcon icon={editingSellUnitIndex !== null ? faCheck : faPlus} />
                    {editingSellUnitIndex !== null ? 'Update Unit' : 'Add Unit'}
                  </button>
                </div>
              )}

              {formData.sellUnits.length > 0 && (
                <div className="add-product-unit-summary">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    {formData.sellUnits.length} unit{formData.sellUnits.length > 1 ? 's' : ''} added.
                    {formData.sellUnits.some(u => u.isBase) ? ' Base unit marked.' : ' Please mark a base unit.'}
                  </span>
                </div>
              )}
            </div>

            <div className="add-product-nav">
              <button type="button" className="add-product-nav-prev" onClick={prevStep}>
                <FontAwesomeIcon icon={faChevronRight} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <button type="button" className="add-product-nav-next" onClick={nextStep}>
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
        STEP 3: Stock Units
        ============================================================ */}
        {activeStep === 3 && (
          <div className="add-product-step-content">
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faWarehouse} /> Stock Units
              </h3>
              <p className="add-product-hint">
                These are the units you use for purchasing and stocking.
                <br />The <strong>first unit you add</strong> will automatically be the base unit.
              </p>

              {/* Show current base unit */}
              {formData.baseUnit.name && (
                <div className="add-product-base-unit-display">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>
                    Base unit: <strong>{formData.baseUnit.label || formData.baseUnit.name}</strong>
                  </span>
                </div>
              )}

              {/* Existing stock units */}
              <div className="add-product-unit-list">
                {formData.stockUnits.length === 0 ? (
                  <div className="add-product-unit-empty">
                    <p>No stock units added yet</p>
                    <span>Click "Add Unit" below to get started</span>
                  </div>
                ) : (
                  formData.stockUnits.map((unit, index) => (
                    <div key={index} className="add-product-unit-item">
                      <div className="add-product-unit-info">
                        <span className="add-product-unit-name">
                          {unit.isBase && <span className="add-product-base-badge">Base</span>}
                          {unit.label || unit.name}
                        </span>
                        <span className="add-product-unit-detail">
                          {unit.conversion} × {formData.baseUnit.label || formData.baseUnit.name}
                        </span>
                        <span className="add-product-unit-price">KES {unit.buyPrice || 0}</span>
                        {unit.barcode && (
                          <span className="add-product-unit-barcode">{unit.barcode}</span>
                        )}
                      </div>
                      <div className="add-product-unit-actions">
                        <button type="button" onClick={() => editStockUnit(index)}>
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button type="button" onClick={() => removeStockUnit(index)} disabled={unit.isBase}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Unit Button */}
              {!showStockForm && (
                <button type="button" className="add-product-unit-toggle" onClick={() => setShowStockForm(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Add Stock Unit
                </button>
              )}

              {/* Add/edit stock unit form */}
              {showStockForm && (
                <div className="add-product-unit-form">
                  <div className="add-product-unit-form-header">
                    <span>{editingStockUnitIndex !== null ? 'Edit Stock Unit' : 'Add Stock Unit'}</span>
                    <button type="button" onClick={() => { setShowStockForm(false); setEditingStockUnitIndex(null); setNewStockUnit(getInitialUnit()); }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Unit Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., kg, sack, crate"
                        value={newStockUnit.name}
                        onChange={(e) => setNewStockUnit({ ...newStockUnit, name: e.target.value })}
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Label</label>
                      <input
                        type="text"
                        placeholder="e.g., Kilogram, 50kg Sack"
                        value={newStockUnit.label}
                        onChange={(e) => setNewStockUnit({ ...newStockUnit, label: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Conversion (per base) *</label>
                      <input
                        type="number"
                        placeholder="e.g., 1, 50, 24"
                        value={newStockUnit.conversion}
                        onChange={(e) => setNewStockUnit({ ...newStockUnit, conversion: parseFloat(e.target.value) || 0 })}
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Buy Price (KES)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newStockUnit.buyPrice}
                        onChange={(e) => setNewStockUnit({ ...newStockUnit, buyPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Barcode</label>
                      <input
                        type="text"
                        placeholder="Barcode for this unit"
                        value={newStockUnit.barcode}
                        onChange={(e) => setNewStockUnit({ ...newStockUnit, barcode: e.target.value })}
                      />
                    </div>
                    
                    {/* Is Base Unit - Only show if no units exist yet */}
                    {formData.stockUnits.length === 0 ? (
                      <div className="add-product-field half">
                        <label className="add-product-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newStockUnit.isBase}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setFormData(prev => ({
                                  ...prev,
                                  stockUnits: prev.stockUnits.map(u => ({ ...u, isBase: false }))
                                }));
                              }
                              setNewStockUnit({ ...newStockUnit, isBase: isChecked });
                            }}
                          />
                          This is the base unit
                          <span className="add-product-label-hint">(Required)</span>
                        </label>
                      </div>
                    ) : (
                      <div className="add-product-field half">
                        <div className="add-product-unit-base-info">
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span>Base unit already set</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button type="button" className="add-product-unit-add" onClick={addStockUnit}>
                    <FontAwesomeIcon icon={editingStockUnitIndex !== null ? faCheck : faPlus} />
                    {editingStockUnitIndex !== null ? 'Update Unit' : 'Add Unit'}
                  </button>
                </div>
              )}

              {formData.stockUnits.length > 0 && (
                <div className="add-product-unit-summary">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    {formData.stockUnits.length} unit{formData.stockUnits.length > 1 ? 's' : ''} added.
                    {formData.stockUnits.some(u => u.isBase) ? ' Base unit marked.' : ' Please mark a base unit.'}
                  </span>
                </div>
              )}
            </div>

            <div className="add-product-nav">
              <button type="button" className="add-product-nav-prev" onClick={prevStep}>
                <FontAwesomeIcon icon={faChevronRight} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <button type="button" className="add-product-nav-next" onClick={nextStep}>
                Next <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
        STEP 4: Settings & Initial Stock
        ============================================================ */}
        {activeStep === 4 && (
          <div className="add-product-step-content">
            {/* Settings Section */}
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faGripLines} /> Settings
              </h3>
              <p className="add-product-hint">
                Set your stock alert level and supplier info.
              </p>
              
              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Min Stock Alert</label>
                  <div className="add-product-input-wrapper">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="add-product-input-icon" />
                    <input
                      type="number"
                      name="minStockAlert"
                      placeholder="5"
                      value={formData.minStockAlert}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
                <div className="add-product-field half">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Supplier name"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="add-product-field">
                <label>Supplier Price</label>
                <input
                  type="number"
                  name="supplierPrice"
                  placeholder="0.00"
                  value={formData.supplierPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Initial Stock Section */}
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faBoxes} /> Initial Stock (Optional)
              </h3>
              <p className="add-product-hint">
                Add starting stock for this product. You can skip this and add stock later from the Stock page.
              </p>
              
              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Unit</label>
                  <select
                    name="unitName"
                    value={initialStock.unitName}
                    onChange={handleInitialStockChange}
                  >
                    <option value="">Select unit</option>
                    {formData.stockUnits.map((unit) => (
                      <option key={unit.name} value={unit.name}>
                        {unit.label} ({unit.conversion} × {formData.baseUnit.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="add-product-field half">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    step="0.01"
                    placeholder="0"
                    value={initialStock.quantity}
                    onChange={handleInitialStockChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Buy Price (per unit)</label>
                  <input
                    type="number"
                    name="buyPrice"
                    step="0.01"
                    placeholder="0.00"
                    value={initialStock.buyPrice}
                    onChange={handleInitialStockChange}
                    min="0"
                  />
                </div>
                <div className="add-product-field half">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    placeholder="Optional"
                    value={initialStock.batchNumber}
                    onChange={handleInitialStockChange}
                  />
                </div>
              </div>

              <div className="add-product-field">
                <label>Supplier (for this batch)</label>
                <input
                  type="text"
                  name="supplier"
                  placeholder="Supplier name (optional)"
                  value={initialStock.supplier}
                  onChange={handleInitialStockChange}
                />
              </div>

              {initialStock.unitName && initialStock.quantity && initialStock.buyPrice ? (
                <div className="add-product-initial-stock-summary">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>
                    Will add <strong>{initialStock.quantity} {initialStock.unitName}</strong> 
                    {' '}at KES {parseFloat(initialStock.buyPrice).toFixed(2)} per unit
                    {initialStock.batchNumber ? ` (Batch: ${initialStock.batchNumber})` : ''}
                  </span>
                </div>
              ) : (
                <div className="add-product-initial-stock-skip">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>No initial stock will be added. You can add stock later.</span>
                </div>
              )}
            </div>

            {/* Review Summary */}
            <div className="add-product-review">
              <h4>Review Your Product</h4>
              <div className="add-product-review-grid">
                <div className="add-product-review-item">
                  <span className="review-label">Name</span>
                  <span className="review-value">{formData.name || '—'}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Category</span>
                  <span className="review-value">{formData.category || '—'}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Base Unit</span>
                  <span className="review-value">{formData.baseUnit.label || formData.baseUnit.name || '—'}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Sell Units</span>
                  <span className="review-value">{formData.sellUnits.length}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Stock Units</span>
                  <span className="review-value">{formData.stockUnits.length}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Min Alert</span>
                  <span className="review-value">{formData.minStockAlert}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Initial Stock</span>
                  <span className="review-value">
                    {initialStock.unitName && initialStock.quantity ? 
                      `${initialStock.quantity} ${initialStock.unitName}` : 
                      'None'
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="add-product-nav">
              <button type="button" className="add-product-nav-prev" onClick={prevStep}>
                <FontAwesomeIcon icon={faChevronRight} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <button type="submit" className="add-product-nav-submit" disabled={loading}>
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    {isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    {isEditing ? 'Update Product' : 'Save Product'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}