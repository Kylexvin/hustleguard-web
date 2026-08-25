// src/pages/ProductStock.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faSpinner,
  faBox,
  faLayerGroup,
  faExchangeAlt,
  faTrash,
  faInfoCircle,
  faCheckCircle,
  faTimes,
  faWarehouse,
  faShoppingCart,
  faCube,
  faEdit,
  faSave,

} from '@fortawesome/free-solid-svg-icons';
import './css/ProductStock.css';

export default function ProductStock() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [stockBatches, setStockBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  // Add stock form
  const [addForm, setAddForm] = useState({
    unitName: '',
    quantity: '',
    buyPrice: '',
    batchNumber: '',
    supplier: '',
    expiryDate: '',
    // Loose quantity fields
    useLoose: false,
    looseQuantity: '',
    bundleSize: ''
  });

  // Convert stock form
  const [convertForm, setConvertForm] = useState({
    fromUnit: '',
    toUnit: '',
    quantity: ''
  });

  // ============================================================
  // Fetch product and stock data
  // ============================================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productRes = await axios.get(`/products/${id}`);
      setProduct(productRes.data.data);

      const stockRes = await axios.get(`/products/${id}/stock`);
      setStockBatches(stockRes.data.data.batches || []);
      
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // Get total stock in base units (includes loose)
  // ============================================================
  const getTotalStock = () => {
    return stockBatches.reduce((sum, batch) => sum + (batch.remainingInBase || 0) + (batch.remainingLooseInBase || 0), 0);
  };

  // ============================================================
  // Get stock by unit (includes loose)
  // ============================================================
  const getStockByUnit = () => {
    const grouped = {};
    stockBatches.forEach(batch => {
      const key = batch.unit.name;
      if (!grouped[key]) {
        grouped[key] = {
          unit: batch.unit,
          totalQuantity: 0,
          totalInBase: 0,
          totalLoose: 0,
          totalLooseInBase: 0,
          batches: []
        };
      }
      grouped[key].totalQuantity += batch.remainingQuantity || 0;
      grouped[key].totalInBase += batch.remainingInBase || 0;
      grouped[key].totalLoose += batch.remainingLoose || 0;
      grouped[key].totalLooseInBase += batch.remainingLooseInBase || 0;
      grouped[key].batches.push(batch);
    });
    return Object.values(grouped);
  };

  // ============================================================
  // Add stock with loose quantity support
  // ============================================================
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!addForm.unitName || !addForm.quantity || !addForm.buyPrice) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    // Validate loose fields
    if (addForm.useLoose) {
      if (!addForm.bundleSize || parseInt(addForm.bundleSize) <= 0) {
        Swal.fire('Error', 'Please enter a valid bundle size (must be greater than 0)', 'error');
        return;
      }
    }

    try {
      setProcessing(true);
      
      const data = {
        unitName: addForm.unitName,
        quantity: parseFloat(addForm.quantity),
        buyPrice: parseFloat(addForm.buyPrice),
        batchNumber: addForm.batchNumber || `BATCH-${Date.now()}`,
        supplier: addForm.supplier || 'Manual Entry',
        expiryDate: addForm.expiryDate || null,
        useLoose: addForm.useLoose,
        looseQuantity: addForm.useLoose ? parseFloat(addForm.looseQuantity || 0) : 0,
        bundleSize: addForm.useLoose ? parseInt(addForm.bundleSize || 0) : 0
      };

      await axios.post(`/products/${id}/stock`, data);
      
      const message = data.useLoose 
        ? `Added ${data.quantity} ${addForm.unitName} + ${data.looseQuantity} loose units (${data.bundleSize} per bundle)`
        : `Added ${data.quantity} ${addForm.unitName} to inventory`;
      
      Swal.fire({
        title: 'Stock Added',
        text: message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setShowAddForm(false);
      setAddForm({ 
        unitName: '', 
        quantity: '', 
        buyPrice: '', 
        batchNumber: '', 
        supplier: '', 
        expiryDate: '',
        useLoose: false,
        looseQuantity: '',
        bundleSize: ''
      });
      fetchData();

    } catch (err) {
      console.error('Error adding stock:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to add stock', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // Convert stock
  // ============================================================
  const handleConvertStock = async (e) => {
    e.preventDefault();

    if (!convertForm.fromUnit || !convertForm.toUnit || !convertForm.quantity) {
      Swal.fire('Error', 'Please fill in all fields', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Convert Stock',
      text: `Convert ${convertForm.quantity} ${convertForm.fromUnit} to ${convertForm.toUnit}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1B4D3D',
      confirmButtonText: 'Convert'
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(true);

      await axios.post(`/products/${id}/convert`, {
        fromUnit: convertForm.fromUnit,
        toUnit: convertForm.toUnit,
        quantity: parseFloat(convertForm.quantity)
      });

      Swal.fire({
        title: 'Converted',
        text: `Successfully converted ${convertForm.quantity} ${convertForm.fromUnit} to ${convertForm.toUnit}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      setShowConvertForm(false);
      setConvertForm({ fromUnit: '', toUnit: '', quantity: '' });
      fetchData();

    } catch (err) {
      console.error('Error converting stock:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to convert stock', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // Delete stock batch
  // ============================================================
  const handleDeleteBatch = async (batchId, batchNumber) => {
    const result = await Swal.fire({
      title: 'Delete Batch?',
      text: `Delete batch ${batchNumber || '#' + batchId}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingBatchId(batchId);
      await axios.delete(`/products/${id}/stock/${batchId}`);
      
      Swal.fire({
        title: 'Deleted',
        text: 'Batch deleted successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      fetchData();

    } catch (err) {
      console.error('Error deleting batch:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to delete batch', 'error');
    } finally {
      setDeletingBatchId(null);
    }
  };

  // ============================================================
  // Edit stock quantity - includes loose
  // ============================================================
  const handleEditQuantity = (batchId, currentQuantity) => {
    setEditingBatchId(batchId);
    setEditQuantity(String(currentQuantity));
  };

  const handleSaveQuantity = async (batchId) => {
    const rawValue = editQuantity.trim();
    if (rawValue === '') {
      Swal.fire('Error', 'Please enter a quantity', 'error');
      return;
    }

    const newQuantity = parseFloat(rawValue);
    if (isNaN(newQuantity) || newQuantity < 0) {
      Swal.fire('Error', 'Please enter a valid quantity (0 or greater)', 'error');
      return;
    }

    const batch = stockBatches.find(b => b._id === batchId);
    if (!batch) {
      Swal.fire('Error', 'Batch not found', 'error');
      return;
    }

    if (newQuantity === batch.remainingQuantity) {
      setEditingBatchId(null);
      setEditQuantity('');
      return;
    }

    const result = await Swal.fire({
      title: 'Update Quantity?',
      text: `Change from ${batch.remainingQuantity} to ${newQuantity} ${batch.unit.label}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1B4D3D',
      confirmButtonText: 'Update'
    });

    if (!result.isConfirmed) return;

    try {
      setProcessing(true);
      
      await axios.put(`/products/${id}/stock/${batchId}`, {
        quantity: newQuantity
      });

      Swal.fire({
        title: 'Updated',
        text: `Quantity updated to ${newQuantity} ${batch.unit.label}`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });

      setEditingBatchId(null);
      setEditQuantity('');
      fetchData();

    } catch (err) {
      console.error('Error updating quantity:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to update quantity', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const cancelEdit = () => {
    setEditingBatchId(null);
    setEditQuantity('');
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <div className="product-stock-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading stock data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-stock-error">
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-stock-error">
        <p>Product not found</p>
        <button onClick={() => navigate('/products')}>Go Back</button>
      </div>
    );
  }

  const totalStock = getTotalStock();
  const stockByUnit = getStockByUnit();

  return (
    <div className="product-stock-container">
      {/* Header */}
      <div className="product-stock-header">
        <button className="product-stock-back" onClick={() => navigate('/products')}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div className="product-stock-title">
          <h2>{product.name}</h2>
          <span className="product-stock-subtitle">
            {product.baseUnit?.label || 'Unit'} · {stockBatches.length} batch
          </span>
        </div>
        <button className="product-stock-add-btn" onClick={() => setShowAddForm(true)}>
          <FontAwesomeIcon icon={faPlus} /> Add Stock
        </button>
      </div>

      {/* Summary Cards */}
      <div className="product-stock-summary">
        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <FontAwesomeIcon icon={faWarehouse} />
          </div>
          <div className="stock-summary-content">
            <span className="stock-summary-label">Total Stock</span>
            <span className="stock-summary-value">{totalStock} {product.baseUnit?.label || 'unit'}</span>
          </div>
        </div>
        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <FontAwesomeIcon icon={faLayerGroup} />
          </div>
          <div className="stock-summary-content">
            <span className="stock-summary-label">Batch</span>
            <span className="stock-summary-value">{stockBatches.length}</span>
          </div>
        </div>
        <div className="stock-summary-card">
          <div className="stock-summary-icon">
            <FontAwesomeIcon icon={faCube} />
          </div>
          <div className="stock-summary-content">
            <span className="stock-summary-label">Unit</span>
            <span className="stock-summary-value">{stockByUnit.length}</span>
          </div>
        </div>
      </div>

      {/* Stock by Unit */}
      <div className="product-stock-section">
        <h3>
          <FontAwesomeIcon icon={faShoppingCart} /> Stock by Unit
        </h3>
        <div className="stock-unit-grid">
          {stockByUnit.length === 0 ? (
            <div className="stock-empty">
              <p>No stock found</p>
              <span>Add stock to get started</span>
            </div>
          ) : (
            stockByUnit.map((item) => (
              <div key={item.unit.name} className="stock-unit-card">
                <div className="stock-unit-header">
                  <span className="stock-unit-name">{item.unit.label}</span>
                  <span className="stock-unit-conversion">
                    {item.unit.conversion} × {product.baseUnit?.label}
                  </span>
                </div>
                <div className="stock-unit-body">
                  <div className="stock-unit-quantity">
                    <span className="stock-unit-qty">{item.totalQuantity}</span>
                    <span className="stock-unit-label">{item.unit.label}</span>
                    {item.totalLoose > 0 && (
                      <span className="stock-unit-loose-badge">+{item.totalLoose} loose</span>
                    )}
                  </div>
                  <div className="stock-unit-base">
                    = {item.totalInBase + item.totalLooseInBase} {product.baseUnit?.label}
                    {item.totalLooseInBase > 0 && (
                      <span className="stock-unit-loose-base"> ({item.totalLooseInBase} loose)</span>
                    )}
                  </div>
                </div>
                <div className="stock-unit-batches">
                  {item.batches.map((batch, idx) => (
                    <div key={batch._id || idx} className="stock-batch-mini">
                      <span className="batch-qty">
                        {batch.remainingQuantity} {item.unit.label}
                        {batch.remainingLoose > 0 && (
                          <span className="batch-loose"> + {batch.remainingLoose} loose</span>
                        )}
                      </span>
                      {batch.batchNumber && (
                        <span className="batch-number">#{batch.batchNumber}</span>
                      )}
                      {batch.bundleSize > 0 && (
                        <span className="batch-bundle-size">({batch.bundleSize}/bundle)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Batches */}
      <div className="product-stock-section">
        <h3>
          <FontAwesomeIcon icon={faBox} /> All Batch
        </h3>
        <div className="stock-batch-list">
          {stockBatches.length === 0 ? (
            <div className="stock-empty">
              <p>No batch found</p>
            </div>
          ) : (
            <table className="stock-batch-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Unit</th>
                  <th>Bundles</th>
                  <th>Loose</th>
                  <th>In Base</th>
                  <th>Buy Price</th>
                  <th>Supplier</th>
                  <th>Expiry</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stockBatches.map((batch) => (
                  <tr key={batch._id}>
                    <td>{batch.batchNumber || '—'}</td>
                    <td>{batch.unit.label}</td>
                    <td>
                      {editingBatchId === batch._id ? (
                        <div className="edit-quantity-cell">
                          <input
                            type="text"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="edit-quantity-input"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                          />
                          <button 
                            onClick={() => handleSaveQuantity(batch._id)}
                            className="edit-save-btn"
                            disabled={processing}
                          >
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="edit-cancel-btn"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ) : (
                        <span>{batch.remainingQuantity}</span>
                      )}
                    </td>
                    <td>{batch.remainingLoose || 0}</td>
                    <td>{batch.remainingInBase + (batch.remainingLooseInBase || 0)}</td>
                    <td>KES {batch.buyPrice}</td>
                    <td>{batch.supplierName || '—'}</td>
                    <td>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="batch-actions">
                        {editingBatchId !== batch._id && (
                          <button 
                            className="batch-edit-btn"
                            onClick={() => handleEditQuantity(batch._id, batch.remainingQuantity)}
                            title="Edit quantity"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                        )}
                        <button 
                          className="batch-delete-btn"
                          onClick={() => handleDeleteBatch(batch._id, batch.batchNumber)}
                          disabled={deletingBatchId === batch._id}
                          title="Delete batch"
                        >
                          {deletingBatchId === batch._id ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon icon={faTrash} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Stock Modal with Loose Quantity */}
      {showAddForm && (
        <div className="product-stock-modal">
          <div className="product-stock-modal-content">
            <div className="product-stock-modal-header">
              <h3><FontAwesomeIcon icon={faPlus} /> Add Stock</h3>
              <button onClick={() => setShowAddForm(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleAddStock}>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={addForm.unitName}
                    onChange={(e) => setAddForm({ ...addForm, unitName: e.target.value })}
                    required
                  >
                    <option value="">Select unit</option>
                    {product.stockUnits?.map((unit) => (
                      <option key={unit.name} value={unit.name}>
                        {unit.label} ({unit.conversion} × {product.baseUnit?.label})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Buy Price per Unit *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={addForm.buyPrice}
                    onChange={(e) => setAddForm({ ...addForm, buyPrice: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={addForm.batchNumber}
                    onChange={(e) => setAddForm({ ...addForm, batchNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    placeholder="Supplier name"
                    value={addForm.supplier}
                    onChange={(e) => setAddForm({ ...addForm, supplier: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={addForm.expiryDate}
                    onChange={(e) => setAddForm({ ...addForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* ============================================================
              LOOSE QUANTITY SECTION
              ============================================================ */}
              <div className="form-divider">
                <hr />
                <span>Loose Quantity (Optional)</span>
                <hr />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={addForm.useLoose}
                      onChange={(e) => setAddForm({ ...addForm, useLoose: e.target.checked })}
                    />
                    Enable Loose Quantity
                  </label>
                  <span className="form-hint">
                    Use for products sold in bundles with loose units
                  </span>
                </div>
              </div>

              {addForm.useLoose && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bundle Size (units per bundle) *</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g., 10"
                        value={addForm.bundleSize}
                        onChange={(e) => setAddForm({ ...addForm, bundleSize: e.target.value })}
                        min="1"
                      />
                      <span className="form-hint">How many units make one bundle?</span>
                    </div>
                    <div className="form-group">
                      <label>Loose Quantity</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="e.g., 7"
                        value={addForm.looseQuantity}
                        onChange={(e) => setAddForm({ ...addForm, looseQuantity: e.target.value })}
                        min="0"
                      />
                      <span className="form-hint">Individual units outside bundles</span>
                    </div>
                  </div>
                  {addForm.quantity && addForm.bundleSize && (
                    <div className="form-info-box">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <span>
                        <strong>Total:</strong> {parseInt(addForm.quantity || 0)} bundles × {parseInt(addForm.bundleSize || 0)} = {parseInt(addForm.quantity || 0) * parseInt(addForm.bundleSize || 0)} units
                        {addForm.looseQuantity ? ` + ${parseInt(addForm.looseQuantity)} loose = ${(parseInt(addForm.quantity || 0) * parseInt(addForm.bundleSize || 0)) + parseInt(addForm.looseQuantity)} total` : ''}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" disabled={processing}>
                  {processing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheckCircle} />}
                  {processing ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Stock Modal */}
      {showConvertForm && (
        <div className="product-stock-modal">
          <div className="product-stock-modal-content">
            <div className="product-stock-modal-header">
              <h3><FontAwesomeIcon icon={faExchangeAlt} /> Convert Stock</h3>
              <button onClick={() => setShowConvertForm(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleConvertStock}>
              <div className="form-row">
                <div className="form-group">
                  <label>From Unit *</label>
                  <select
                    value={convertForm.fromUnit}
                    onChange={(e) => setConvertForm({ ...convertForm, fromUnit: e.target.value })}
                    required
                  >
                    <option value="">Select unit</option>
                    {product.stockUnits?.map((unit) => (
                      <option key={unit.name} value={unit.name}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>To Unit *</label>
                  <select
                    value={convertForm.toUnit}
                    onChange={(e) => setConvertForm({ ...convertForm, toUnit: e.target.value })}
                    required
                  >
                    <option value="">Select unit</option>
                    {product.stockUnits?.map((unit) => (
                      <option key={unit.name} value={unit.name}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity to Convert *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={convertForm.quantity}
                    onChange={(e) => setConvertForm({ ...convertForm, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <div className="convert-info">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <span>Convert to base unit first, then to target</span>
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowConvertForm(false)}>Cancel</button>
                <button type="submit" disabled={processing}>
                  {processing ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faExchangeAlt} />}
                  {processing ? 'Converting...' : 'Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}