// src/pages/AddProduct.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import './css/AddProduct.css';

export default function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [alert, setAlert] = useState(null);

  // Form Data
  const [product, setProduct] = useState({
    name: '',
    description: '',
    category: '',
    supplier: '',
    minStockAlert: 5,
    initialStock: 0
  });

  const [units, setUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({
    name: '',
    label: '',
    conversion: 1,
    sellPrice: 0,
    buyPrice: 0,
    isBase: false
  });

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/categories');
        setCategories(response.data.data.map(c => c.name));
      } catch {
        setCategories(['Electronics', 'Clothing', 'Food', 'Beverages', 'Other']);
      }
    };
    fetchCategories();
  }, []);

  // Fetch product for editing
  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          setFetching(true);
          const response = await axios.get(`/products/${id}`);
          const productData = response.data.data;
          
          setProduct({
            name: productData.name || '',
            description: productData.description || '',
            category: productData.category || '',
            supplier: productData.supplier || '',
            minStockAlert: productData.minStockAlert || 5,
            initialStock: productData.stock || 0
          });
          
          setUnits(productData.units || []);
        } catch (err) {
          console.error('Error fetching product:', err);
          showAlert('Failed to load product data', 'error');
          setTimeout(() => navigate('/products'), 1500);
        } finally {
          setFetching(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing, navigate]);

  // Alert system
  const showAlert = (message, type = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const openUnitModal = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setNewUnit({ ...unit });
    } else {
      setEditingUnit(null);
      setNewUnit({ 
        name: '', 
        label: '', 
        conversion: 1,
        sellPrice: 0, 
        buyPrice: 0, 
        isBase: !units.some(u => u.isBase)
      });
    }
    setShowUnitModal(true);
    setAlert(null);
  };

  const saveUnit = () => {
    if (!newUnit.name) {
      showAlert('Unit name is required');
      return;
    }

    if (newUnit.conversion <= 0) {
      showAlert('Conversion must be greater than 0');
      return;
    }

    if (newUnit.isBase) {
      newUnit.conversion = 1;
    }

    if (newUnit.isBase) {
      setUnits(prev => prev.map(u => ({ ...u, isBase: false })));
    }

    if (editingUnit) {
      setUnits(prev => prev.map(u => u === editingUnit ? { ...newUnit, isBase: newUnit.isBase } : u));
    } else {
      setUnits(prev => [...prev, { ...newUnit }]);
    }

    setShowUnitModal(false);
    setEditingUnit(null);
    setNewUnit({ 
      name: '', 
      label: '', 
      conversion: 1,
      sellPrice: 0, 
      buyPrice: 0, 
      isBase: false 
    });
    showAlert(`${newUnit.label || newUnit.name} added`, 'success');
  };

  const removeUnit = (index) => {
    const unit = units[index];
    if (unit.isBase) {
      showAlert('Cannot remove base unit');
      return;
    }
    setUnits(prev => prev.filter((_, i) => i !== index));
    showAlert(`${unit.label || unit.name} removed`, 'success');
  };

const handleSubmit = async () => {
  if (!product.name || !product.category || units.length === 0) {
    showAlert('Please fill all required fields and add at least one unit');
    return;
  }

  if (!units.some(u => u.isBase)) {
    showAlert('Please mark one unit as the base unit');
    return;
  }

  try {
    setLoading(true);
    
    const payload = {
      name: product.name,
      description: product.description,
      category: product.category,
      supplier: product.supplier,
      minStockAlert: parseInt(product.minStockAlert),
      initialStock: parseInt(product.initialStock) || 0,
      units: units.map(u => ({
        name: u.name,
        label: u.label || u.name,
        conversion: u.isBase ? 1 : parseFloat(u.conversion) || 1,
        isBase: u.isBase,
        sellPrice: parseFloat(u.sellPrice) || 0,
        buyPrice: parseFloat(u.buyPrice) || 0
      }))
    };

    // ✅ Fixed - removed unused 'response' variable
    if (isEditing) {
      await axios.put(`/products/${id}`, payload);
    } else {
      await axios.post('/products', payload);
    }

    await Swal.fire({
      title: isEditing ? 'Product Updated' : 'Product Created',
      text: `${product.name} ${isEditing ? 'updated' : 'added'} successfully. Stock: ${product.initialStock} units.`,
      icon: 'success',
      confirmButtonText: 'View Products',
      confirmButtonColor: '#1a7f4e'
    });

    navigate('/products');

  } catch (err) {
    showAlert(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} product`);
  } finally {
    setLoading(false);
  }
};

  const getAlertIcon = () => {
    if (!alert) return null;
    switch (alert.type) {
      case 'success': return <CheckCircle size={18} />;
      case 'error': return <AlertCircle size={18} />;
      default: return <Info size={18} />;
    }
  };

  const baseUnitExists = units.some(u => u.isBase);
  const baseUnit = units.find(u => u.isBase);

  if (fetching) {
    return (
      <div className="add-product-loading">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div className="add-product">
      {/* Alert */}
      {alert && (
        <div className={`alert ${alert.type}`}>
          <div className="alert-content">
            {getAlertIcon()}
            <span>{alert.message}</span>
          </div>
          <button className="alert-close" onClick={() => setAlert(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="add-product-header">
        <button onClick={() => navigate('/products')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <h2>{isEditing ? 'Edit Product' : 'Add Product'}</h2>
        <span className="step-indicator">Step {step} of 2</span>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className={`progress-fill ${step === 2 ? 'complete' : ''}`} style={{ width: step === 1 ? '50%' : '100%' }} />
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="step-content">
          <div className="form-group">
            <label>Product Name <span className="required">*</span></label>
            <input
              name="name"
              placeholder="e.g., Samsung Galaxy S24"
              value={product.name}
              onChange={handleProductChange}
            />
          </div>

          <div className="form-group">
            <label>Category <span className="required">*</span></label>
            <select name="category" value={product.category} onChange={handleProductChange}>
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Brief product description"
              value={product.description}
              onChange={handleProductChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Supplier</label>
              <input
                name="supplier"
                placeholder="Supplier name"
                value={product.supplier}
                onChange={handleProductChange}
              />
            </div>
            <div className="form-group half">
              <label>Min Stock Alert</label>
              <input
                type="number"
                name="minStockAlert"
                placeholder="5"
                value={product.minStockAlert}
                onChange={handleProductChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Initial Stock</label>
            <input
              type="number"
              name="initialStock"
              placeholder="0"
              value={product.initialStock}
              onChange={handleProductChange}
              disabled={isEditing}
            />
            <small>
              {isEditing 
                ? 'Stock cannot be edited here. Use "Add Stock" on Products page.' 
                : 'Stock in base unit (will be set in next step)'}
            </small>
          </div>

          <button className="next-btn" onClick={() => setStep(2)}>
            Next - Units & Pricing
          </button>
        </div>
      )}

      {/* Step 2: Units */}
      {step === 2 && (
        <div className="step-content">
          <div className="units-header">
            <h3>Units & Pricing</h3>
            <button className="add-unit-btn" onClick={() => openUnitModal()}>
              <Plus size={18} /> Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <div className="empty-units">
              <Package size={48} />
              <p>No units added yet</p>
              <span>Click Add Unit to get started</span>
            </div>
          ) : (
            <div className="units-list">
              {units.map((unit, index) => (
                <div key={index} className="unit-item">
                  <div className="unit-info">
                    <span className="unit-name">
                      {unit.label || unit.name}
                      {unit.isBase && <span className="base-badge">Base</span>}
                    </span>
                    <span className="unit-prices">
                      {!unit.isBase && `Conversion: ${unit.conversion} | `}
                      Buy: KES {unit.buyPrice.toLocaleString()} | Sell: KES {unit.sellPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="unit-actions">
                    <button onClick={() => openUnitModal(unit)} className="edit-btn">
                      <span className="edit-icon">✎</span>
                    </button>
                    <button onClick={() => removeUnit(index)} className="delete-btn" disabled={unit.isBase}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="step-actions">
            <button className="back-btn-secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={loading || units.length === 0}
            >
              {loading ? (
                'Saving...'
              ) : (
                <><Save size={18} /> {isEditing ? 'Update Product' : 'Create Product'}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUnit ? 'Edit Unit' : 'Add Unit'}</h3>
              <button className="modal-close" onClick={() => setShowUnitModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Unit Name <span className="required">*</span></label>
                <input
                  placeholder="e.g., piece, kg, box"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Label</label>
                <input
                  placeholder="e.g., Pcs, Kg, Box"
                  value={newUnit.label}
                  onChange={(e) => setNewUnit({ ...newUnit, label: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Buy Price (KES)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newUnit.buyPrice}
                    onChange={(e) => setNewUnit({ ...newUnit, buyPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group half">
                  <label>Sell Price (KES)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newUnit.sellPrice}
                    onChange={(e) => setNewUnit({ ...newUnit, sellPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Conversion (per base unit)</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newUnit.conversion}
                  onChange={(e) => setNewUnit({ ...newUnit, conversion: parseFloat(e.target.value) || 1 })}
                  min="0.001"
                  step="0.001"
                  disabled={newUnit.isBase}
                />
                <small>
                  {newUnit.isBase 
                    ? 'Base unit conversion is always 1' 
                    : 'How many of this unit equals 1 base unit? (e.g., 10 for box of 10)'}
                </small>
              </div>

              {/* Show checkbox only when no base unit exists */}
              {!baseUnitExists && (
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={newUnit.isBase}
                      onChange={(e) => {
                        setNewUnit({ 
                          ...newUnit, 
                          isBase: e.target.checked,
                          conversion: e.target.checked ? 1 : newUnit.conversion
                        });
                      }}
                    />
                    This is the base unit
                  </label>
                </div>
              )}

              {/* Show base unit info when base already exists */}
              {baseUnitExists && (
                <div className="form-group base-info">
                  <div className="base-unit-info">
                    <Info size={16} />
                    <span>Base unit: <strong>{baseUnit?.label || baseUnit?.name}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUnitModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={saveUnit}>
                {editingUnit ? 'Update Unit' : 'Add Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}