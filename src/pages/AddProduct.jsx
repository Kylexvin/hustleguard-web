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
  faLayerGroup,
  faBoxes,
  faPlusCircle,
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
  const [loadingCategories, setLoadingCategories] = useState(true);

  // ============================================================
  // Product Data
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
    supplier: '',
    expiryDate: '',
    bundleSize: '',
  });

  // ============================================================
  // Computed: Bundles & Loose from Quantity + Bundle Size
  // ============================================================
  const getBundlesAndLoose = useCallback(() => {
    const qty = parseInt(initialStock.quantity) || 0;
    const size = parseInt(initialStock.bundleSize) || 0;

    if (size <= 0) {
      return { bundles: 0, loose: qty, total: qty };
    }

    const bundles = Math.floor(qty / size);
    const loose = qty % size;
    return { bundles, loose, total: qty };
  }, [initialStock.quantity, initialStock.bundleSize]);

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

  const [newUnit, setNewUnit] = useState(getInitialUnit());
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [showUnitForm, setShowUnitForm] = useState(false);

  // ============================================================
  // Steps Configuration
  // ============================================================
  const steps = [
    { id: 1, label: 'Basic Info', icon: faTag },
    { id: 2, label: 'Units & Pricing', icon: faLayerGroup },
    { id: 3, label: 'Stock & Review', icon: faBoxes }
  ];

  const isStepValid = (stepId) => {
    switch (stepId) {
      case 1:
        return formData.name.trim() !== '' && formData.category !== '';
      case 2:
        return formData.sellUnits.length > 0 && formData.sellUnits.some(u => u.isBase);
      case 3:
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
  // Fetch categories from Categories API
  // ============================================================
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get('/categories');
      const categoryNames = response.data.data.map(c => c.name) || [];
      setCategories(categoryNames);
    } catch (err) {
      // Fallback to hardcoded if API fails
      setCategories([
        'Electronics', 'Clothing', 'Food', 'Beverages',
        'Health', 'Beauty', 'Home', 'Sports', 'Toys', 'Books', 'Other'
      ]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        2: 'Please add at least one unit and mark a base unit',
        3: 'Settings are complete'
      };
      Swal.fire({
        title: 'Complete This Step',
        text: stepNames[activeStep] || 'Please complete all required fields',
        icon: 'info',
        confirmButtonColor: '#1B4D3D'
      });
      return;
    }

    if (activeStep < 3) {
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
  // Units
  // ============================================================
  const addUnit = () => {
    if (!newUnit.name) {
      setError('Unit name is required');
      return;
    }
    if (newUnit.conversion <= 0) {
      setError('Conversion must be greater than 0');
      return;
    }

    if (formData.sellUnits.some(u => u.name === newUnit.name) && editingUnitIndex === null) {
      setError(`Unit "${newUnit.name}" already exists`);
      return;
    }

    const isBase = formData.sellUnits.length === 0 ? true : newUnit.isBase;
    const buyPrice = isBase ? (newUnit.buyPrice || 0) : 0;

    if (formData.sellUnits.length === 0) {
      setFormData(prev => ({
        ...prev,
        baseUnit: {
          name: newUnit.name,
          label: newUnit.label || newUnit.name
        }
      }));
    }

    const sellEntry = {
      name: newUnit.name,
      label: newUnit.label || newUnit.name,
      conversion: newUnit.conversion,
      isBase,
      sellPrice: newUnit.sellPrice || 0,
      buyPrice,
      barcode: newUnit.barcode,
      isActive: true
    };
    const stockEntry = {
      name: newUnit.name,
      label: newUnit.label || newUnit.name,
      conversion: newUnit.conversion,
      isBase,
      buyPrice,
      sellPrice: newUnit.sellPrice || 0,
      barcode: newUnit.barcode,
      isActive: true
    };

    if (editingUnitIndex !== null) {
      const updatedSell = [...formData.sellUnits];
      const updatedStock = [...formData.stockUnits];
      updatedSell[editingUnitIndex] = sellEntry;
      updatedStock[editingUnitIndex] = stockEntry;
      setFormData(prev => ({ ...prev, sellUnits: updatedSell, stockUnits: updatedStock }));
      setEditingUnitIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        sellUnits: [...prev.sellUnits, sellEntry],
        stockUnits: [...prev.stockUnits, stockEntry]
      }));
    }

    setNewUnit(getInitialUnit());
    setShowUnitForm(false);
    setError(null);
    Swal.fire({
      title: 'Unit Added',
      text: `"${sellEntry.label}" added — usable for both selling and stocking`,
      icon: 'success',
      timer: 1200,
      showConfirmButton: false
    });
  };

  const editUnit = (index) => {
    const unit = formData.sellUnits[index];
    const stockUnit = formData.stockUnits[index] || {};
    setNewUnit({
      name: unit.name,
      label: unit.label,
      conversion: unit.conversion,
      isBase: unit.isBase,
      sellPrice: unit.sellPrice || 0,
      buyPrice: stockUnit.buyPrice || 0,
      barcode: unit.barcode || '',
      isActive: true
    });
    setEditingUnitIndex(index);
    setShowUnitForm(true);
  };

  const removeUnit = (index) => {
    const unit = formData.sellUnits[index];
    if (unit.isBase) {
      setError('Cannot remove the base unit');
      return;
    }
    setFormData(prev => ({
      ...prev,
      sellUnits: prev.sellUnits.filter((_, i) => i !== index),
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
        setError('Please add a unit first to set the base unit.');
        setLoading(false);
        return;
      }

      if (formData.sellUnits.length === 0) {
        setError('Please add at least one unit.');
        setLoading(false);
        return;
      }

      const hasBase = formData.sellUnits.some(u => u.isBase);
      if (!hasBase) {
        setError('Please mark one unit as the base unit.');
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

      // --- ADD INITIAL STOCK ---
      let stockAdded = false;
      let stockMessage = '';
      const hasQuantity = initialStock.unitName && initialStock.quantity && initialStock.buyPrice;

      if (hasQuantity) {
        try {
          const qty = parseFloat(initialStock.quantity) || 0;
          const size = parseInt(initialStock.bundleSize) || 0;
          const loose = qty % size;
          const bundles = Math.floor(qty / size);

          await axios.post(`/products/${productId}/stock`, {
            unitName: initialStock.unitName,
            quantity: bundles,
            buyPrice: parseFloat(initialStock.buyPrice),
            batchNumber: initialStock.batchNumber || `INITIAL-${Date.now()}`,
            supplier: initialStock.supplier || formData.supplier || 'Initial Stock',
            expiryDate: initialStock.expiryDate || null,
            useLoose: loose > 0,
            looseQuantity: loose,
            bundleSize: size
          });

          stockAdded = true;
          stockMessage = `Added ${qty} ${initialStock.unitName} (${bundles} bundles × ${size} + ${loose} loose).`;
        } catch (stockErr) {
          console.warn('Failed to add initial stock:', stockErr);
          stockMessage = 'Product created, but initial stock failed. Add stock later.';
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
            supplier: '',
            expiryDate: '',
            bundleSize: '',
          });
          setNewUnit(getInitialUnit());
          setActiveStep(1);
          setShowUnitForm(false);
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

      {/* Progress Steps */}
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

              {/* ============================================================
              CATEGORY FIELD WITH CTA
              ============================================================ */}
              <div className="add-product-field">
                <label>Category *</label>
                <div className="add-product-input-wrapper">
                  <FontAwesomeIcon icon={faStore} className="add-product-input-icon" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={loadingCategories}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {loadingCategories ? (
                  <div className="add-product-category-hint">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>Loading categories...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="add-product-category-hint error">
                    <span>No categories found.</span>
                    <button
                      type="button"
                      className="add-product-category-cta"
                      onClick={() => navigate('/categories')}
                    >
                      <FontAwesomeIcon icon={faPlusCircle} /> Create Category
                    </button>
                  </div>
                ) : (
                  <div className="add-product-category-hint">
                    <span>
                      {categories.length} category{categories.length > 1 ? 'ies' : ''} available.
                      <button
                        type="button"
                        className="add-product-category-cta inline"
                        onClick={() => navigate('/categories')}
                      >
                        <FontAwesomeIcon icon={faPlusCircle} /> Manage Categories
                      </button>
                    </span>
                  </div>
                )}
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

              {formData.baseUnit.name && (
                <div className="add-product-base-unit-display">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    Base unit will be: <strong>{formData.baseUnit.label || formData.baseUnit.name}</strong>
                    {' '}(set automatically from your first unit)
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
        STEP 2: Units & Pricing
        ============================================================ */}
        {activeStep === 2 && (
          <div className="add-product-step-content">
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faLayerGroup} /> Units & Pricing
              </h3>
              <p className="add-product-hint">
                Add every unit you sell or stock this product in — e.g. Kilogram, 500ml, Crate.
                <br />Every unit gets a <strong>sell price</strong>. Only the <strong>base unit</strong> carries a buy price — sub-units convert against it.
                <br />The <strong>first unit you add</strong> becomes the base unit.
              </p>

              {formData.baseUnit.name && (
                <div className="add-product-base-unit-display">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>
                    Base unit: <strong>{formData.baseUnit.label || formData.baseUnit.name}</strong>
                  </span>
                </div>
              )}

              {/* Existing units */}
              <div className="add-product-unit-list">
                {formData.sellUnits.length === 0 ? (
                  <div className="add-product-unit-empty">
                    <p>No units added yet</p>
                    <span>Click "Add Unit" below to get started</span>
                  </div>
                ) : (
                  formData.sellUnits.map((unit, index) => {
                    const stockUnit = formData.stockUnits[index] || {};
                    return (
                      <div key={index} className="add-product-unit-item">
                        <div className="add-product-unit-info">
                          <span className="add-product-unit-name">
                            {unit.isBase && <span className="add-product-base-badge">Base</span>}
                            {unit.label || unit.name}
                          </span>
                          <span className="add-product-unit-detail">
                            {unit.conversion} × {formData.baseUnit.label || formData.baseUnit.name}
                          </span>
                          <span className="add-product-unit-price">
                            {unit.isBase ? `Buy KES ${stockUnit.buyPrice || 0} / ` : ''}Sell KES {unit.sellPrice || 0}
                          </span>
                          {unit.barcode && (
                            <span className="add-product-unit-barcode">{unit.barcode}</span>
                          )}
                        </div>
                        <div className="add-product-unit-actions">
                          <button type="button" onClick={() => editUnit(index)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button type="button" onClick={() => removeUnit(index)} disabled={unit.isBase}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!showUnitForm && (
                <button type="button" className="add-product-unit-toggle" onClick={() => setShowUnitForm(true)}>
                  <FontAwesomeIcon icon={faPlus} /> Add Unit
                </button>
              )}

              {showUnitForm && (
                <div className="add-product-unit-form">
                  <div className="add-product-unit-form-header">
                    <span>{editingUnitIndex !== null ? 'Edit Unit' : 'Add Unit'}</span>
                    <button type="button" onClick={() => { setShowUnitForm(false); setEditingUnitIndex(null); setNewUnit(getInitialUnit()); }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Unit Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., kg, 500ml, crate"
                        value={newUnit.name}
                        onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Label</label>
                      <input
                        type="text"
                        placeholder="e.g., Kilogram, Crate (24pc)"
                        value={newUnit.label}
                        onChange={(e) => setNewUnit({ ...newUnit, label: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Conversion (per base) *</label>
                      <input
                        type="number"
                        placeholder="e.g., 1, 0.5, 24"
                        value={newUnit.conversion}
                        onChange={(e) => setNewUnit({ ...newUnit, conversion: parseFloat(e.target.value) || 0 })}
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                    <div className="add-product-field half">
                      <label>Barcode</label>
                      <input
                        type="text"
                        placeholder="Barcode for this unit"
                        value={newUnit.barcode}
                        onChange={(e) => setNewUnit({ ...newUnit, barcode: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="add-product-row">
                    <div className="add-product-field half">
                      <label>Sell Price (KES)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newUnit.sellPrice}
                        onChange={(e) => setNewUnit({ ...newUnit, sellPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {(formData.sellUnits.length === 0 || newUnit.isBase) ? (
                      <div className="add-product-field half">
                        <label>Buy Price (KES)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newUnit.buyPrice}
                          onChange={(e) => setNewUnit({ ...newUnit, buyPrice: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    ) : (
                      <div className="add-product-field half">
                        <div className="add-product-unit-base-info">
                          <FontAwesomeIcon icon={faInfoCircle} />
                          <span>Buy price set on base unit only</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="add-product-row">
                    {formData.sellUnits.length === 0 ? (
                      <div className="add-product-field half">
                        <label className="add-product-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newUnit.isBase}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                setFormData(prev => ({
                                  ...prev,
                                  sellUnits: prev.sellUnits.map(u => ({ ...u, isBase: false })),
                                  stockUnits: prev.stockUnits.map(u => ({ ...u, isBase: false }))
                                }));
                              }
                              setNewUnit({ ...newUnit, isBase: isChecked });
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
                  <button type="button" className="add-product-unit-add" onClick={addUnit}>
                    <FontAwesomeIcon icon={editingUnitIndex !== null ? faCheck : faPlus} />
                    {editingUnitIndex !== null ? 'Update Unit' : 'Add Unit'}
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
        STEP 3: Settings, Initial Stock, and Review
        ============================================================ */}
        {activeStep === 3 && (
          <div className="add-product-step-content">
            {/* Settings Section */}
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} /> Settings
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

            {/* ============================================================
            INITIAL STOCK SECTION
            ============================================================ */}
            <div className="add-product-section">
              <h3>
                <FontAwesomeIcon icon={faBoxes} /> Initial Stock (Optional)
              </h3>
              <p className="add-product-hint">
                Add starting stock right now — skip if you'd rather add stock later.
              </p>

              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Unit *</label>
                  <select
                    name="unitName"
                    value={initialStock.unitName}
                    onChange={handleInitialStockChange}
                  >
                    <option value="">Select unit</option>
                    {formData.stockUnits.map((unit) => (
                      <option key={unit.name} value={unit.name}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="add-product-field half">
                  <label>Total Units *</label>
                  <input
                    type="number"
                    name="quantity"
                    step="1"
                    placeholder="e.g., 33"
                    value={initialStock.quantity}
                    onChange={handleInitialStockChange}
                    min="0"
                  />
                  <span className="add-product-hint small">Total units (bundles + loose combined)</span>
                </div>
              </div>

              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Buy Price per Unit *</label>
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

              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    placeholder="Supplier name"
                    value={initialStock.supplier}
                    onChange={handleInitialStockChange}
                  />
                </div>
                <div className="add-product-field half">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={initialStock.expiryDate}
                    onChange={handleInitialStockChange}
                  />
                </div>
              </div>

              {/* Bundles / Loose Section */}
              <div className="add-product-divider">
                <span>Bundle Breakdown</span>
              </div>

              <div className="add-product-row">
                <div className="add-product-field half">
                  <label>Bundle / Crate Size</label>
                  <input
                    type="number"
                    name="bundleSize"
                    step="1"
                    placeholder="e.g., 10"
                    value={initialStock.bundleSize}
                    onChange={handleInitialStockChange}
                    min="0"
                  />
                  <span className="add-product-hint small">How many units make 1 bundle/crate?</span>
                </div>
                <div className="add-product-field half">
                  <label>&nbsp;</label>
                  <div className="add-product-bundle-preview">
                    {initialStock.quantity && initialStock.bundleSize ? (
                      <>
                        <span className="bundle-preview-bundles">
                          {getBundlesAndLoose().bundles} bundles
                        </span>
                        <span className="bundle-preview-loose">
                          + {getBundlesAndLoose().loose} loose
                        </span>
                        <span className="bundle-preview-total">
                          = {getBundlesAndLoose().total} total
                        </span>
                      </>
                    ) : (
                      <span className="bundle-preview-empty">Enter quantity & size to preview</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock Summary */}
              {initialStock.unitName && (initialStock.quantity || initialStock.looseQuantity) && (
                <div className="add-product-stock-summary">
                  <div className="stock-summary-row">
                    <span className="stock-summary-label">Bundles:</span>
                    <span className="stock-summary-value">
                      {getBundlesAndLoose().bundles} × {initialStock.bundleSize || 0} = {getBundlesAndLoose().bundles * (parseInt(initialStock.bundleSize) || 0)} {initialStock.unitName}
                    </span>
                  </div>
                  {getBundlesAndLoose().loose > 0 && (
                    <div className="stock-summary-row">
                      <span className="stock-summary-label">Loose:</span>
                      <span className="stock-summary-value">+ {getBundlesAndLoose().loose} {initialStock.unitName}</span>
                    </div>
                  )}
                  <div className="stock-summary-row total">
                    <span className="stock-summary-label">Total:</span>
                    <span className="stock-summary-value">
                      {getBundlesAndLoose().total} {initialStock.unitName}
                    </span>
                  </div>
                  {initialStock.buyPrice && (
                    <div className="stock-summary-row">
                      <span className="stock-summary-label">Total Cost:</span>
                      <span className="stock-summary-value">
                        KES {getBundlesAndLoose().total * parseFloat(initialStock.buyPrice || 0)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!initialStock.unitName && !initialStock.quantity && (
                <div className="add-product-no-stock">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>No stock will be added. Add stock later from the Stock page.</span>
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
                  <span className="review-label">Units</span>
                  <span className="review-value">{formData.sellUnits.length}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Min Alert</span>
                  <span className="review-value">{formData.minStockAlert}</span>
                </div>
                <div className="add-product-review-item">
                  <span className="review-label">Initial Stock</span>
                  <span className="review-value">
                    {initialStock.unitName && initialStock.quantity ? (
                      <>
                        {getBundlesAndLoose().total} {initialStock.unitName}
                        {initialStock.bundleSize > 0 && ` (${getBundlesAndLoose().bundles} bundles × ${initialStock.bundleSize})`}
                        {getBundlesAndLoose().loose > 0 && ` + ${getBundlesAndLoose().loose} loose`}
                      </>
                    ) : (
                      'None'
                    )}
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