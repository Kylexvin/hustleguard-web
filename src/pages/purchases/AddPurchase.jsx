// src/pages/purchases/AddPurchase.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  PackagePlus,
  Save,
  Search,
  X,
  AlertCircle,
  Package
} from 'lucide-react';
import './css/AddPurchase.css';

const todayISO = () => new Date().toISOString().split('T')[0];

export default function AddPurchase() {
  const navigate = useNavigate();
  const { id } = useParams();                  // present in edit mode
  const [searchParams] = useSearchParams();    // ?productId=…&unitName=…
  const isEdit = Boolean(id);

  // ---- form state ----
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [movementDate, setMovementDate] = useState(todayISO());

  // ---- ui state ----
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // ============================================================
  // Load products (and, in edit mode, the purchase)
  // ============================================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prodRes, purchRes] = await Promise.all([
          axios.get('/products'),
          isEdit ? axios.get(`/purchases/${id}`) : Promise.resolve(null)
        ]);

        const list = prodRes.data?.data || prodRes.data?.products || [];
        setProducts(list);

        if (isEdit && purchRes) {
          const p = purchRes.data?.purchase || purchRes.data?.data || purchRes.data;
          // Edit is disabled server-side once a purchase is inside a
          // confirmed counting period — surface that early.
          if (p?.purchaseStatus === 'reversed') {
            setError('This purchase has already been reversed and cannot be edited.');
          }
          setProductId(p.productId);
          setUnitName(p.unit?.name || '');
          setQuantity(p.quantityEntered ?? p.quantityInBase ?? '');
          setBuyingPrice(p.buyingPrice ?? '');
          setSupplier(p.supplier || '');
          setNotes(p.notes || '');
          setMovementDate(
            p.movementDate ? p.movementDate.slice(0, 10) : todayISO()
          );
          // We don't store sellPrice on the movement; leave blank so the
          // user can opt to update it, or fall back to the unit's price.
        } else {
          // pre-fill from ?productId=… query (from Stock Monitor / Products)
          const pid = searchParams.get('productId');
          if (pid) setProductId(pid);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, searchParams]);

  // ============================================================
  // Derived: selected product + base/selected unit
  // ============================================================
  const selectedProduct = useMemo(
    () => products.find(p => p._id === productId) || null,
    [products, productId]
  );

  const activeUnits = useMemo(() => {
    if (!selectedProduct?.units) return [];
    return selectedProduct.units.filter(u => u.isActive !== false);
  }, [selectedProduct]);

  const selectedUnit = useMemo(() => {
    if (!activeUnits.length) return null;
    return (
      activeUnits.find(u => u.name === unitName) ||
      activeUnits.find(u => u.isBase) ||
      activeUnits[0]
    );
  }, [activeUnits, unitName]);

  // When product changes, auto-pick base unit + prefills
  useEffect(() => {
    if (!selectedProduct) return;
    const base = selectedProduct.units?.find(u => u.isBase) || selectedProduct.units?.[0];
    if (base) {
      if (!unitName || !activeUnits.find(u => u.name === unitName)) {
        setUnitName(base.name);
      }
    }
    if (!isEdit) {
      if (!buyingPrice) setBuyingPrice(base?.buyPrice ?? '');
      if (!sellPrice) setSellPrice(base?.sellPrice ?? '');
      if (!supplier && selectedProduct.supplier) setSupplier(selectedProduct.supplier);
    }
  }, [selectedProduct]); // eslint-disable-line

  // When unit changes, refresh default prices
  useEffect(() => {
    if (!selectedUnit || isEdit) return;
    setBuyingPrice(selectedUnit.buyPrice ?? '');
    setSellPrice(selectedUnit.sellPrice ?? '');
  }, [unitName]); // eslint-disable-line

  // ============================================================
  // Derived totals
  // ============================================================
  const quantityInBase = useMemo(() => {
    const q = Number(quantity) || 0;
    const conv = selectedUnit?.conversion || 1;
    return q * conv;
  }, [quantity, selectedUnit]);

  const totalCost = useMemo(() => {
    return quantityInBase * (Number(buyingPrice) || 0);
  }, [quantityInBase, buyingPrice]);

  const fmt = (n) => `KES ${(n || 0).toLocaleString()}`;

  // ============================================================
  // Filtered product list for the picker
  // ============================================================
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  // ============================================================
  // Validation
  // ============================================================
  const canSubmit = useMemo(() => {
    return (
      productId &&
      selectedUnit &&
      Number(quantity) > 0 &&
      Number(buyingPrice) >= 0 &&
      !saving
    );
  }, [productId, selectedUnit, quantity, buyingPrice, saving]);

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSaving(true);
      setError(null);

      const payload = {
        productId,
        unitName: selectedUnit.name,           // backend matches on `name`
        quantity: Number(quantity),
        buyingPrice: Number(buyingPrice),
        supplier: supplier?.trim() || undefined,
        notes: notes?.trim() || undefined,
        movementDate: movementDate
          ? new Date(movementDate + 'T00:00:00').toISOString()
          : undefined
      };

      // Only include sellPrice if explicitly provided
      if (sellPrice !== '' && sellPrice !== null && sellPrice !== undefined) {
        payload.sellPrice = Number(sellPrice);
      }

      if (isEdit) {
        await axios.put(`/purchases/${id}`, payload);
        toast.success('Purchase updated');
      } else {
        await axios.post('/purchases', payload);
        toast.success('Purchase recorded');
      }
      navigate('/purchases');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save purchase';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Loading
  // ============================================================
  if (loading) {
    return (
      <div className="add-purchase-loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  // ============================================================
  // Main
  // ============================================================
  return (
    <div className="add-purchase">
      {/* Header */}
      <div className="add-purchase-header">
        <div className="header-left">
          <button
            className="icon-back-btn"
            onClick={() => navigate('/purchases')}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>{isEdit ? 'Edit Purchase' : 'Receive Stock'}</h2>
            <span className="subtitle">
              {isEdit
                ? 'Update quantity, price, or supplier'
                : 'Log incoming stock and increase available quantity'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="ap-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="ap-card">
        {/* Product picker */}
        <div className="ap-field">
          <label>Product</label>
          {selectedProduct ? (
            <button
              className="ap-product-chip"
              onClick={() => setPickerOpen(true)}
              type="button"
            >
              <Package size={16} />
              <span className="chip-name">{selectedProduct.name}</span>
              <span className="chip-meta">
                Stock: {selectedProduct.stock ?? 0}
              </span>
              <X
                size={14}
                className="chip-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  setProductId('');
                  setUnitName('');
                  setQuantity('');
                  setBuyingPrice('');
                  setSellPrice('');
                  setSupplier('');
                }}
              />
            </button>
          ) : (
            <button
              className="ap-product-placeholder"
              onClick={() => setPickerOpen(true)}
              type="button"
            >
              <Search size={16} />
              Select a product…
            </button>
          )}
        </div>

        {/* Unit / quantity / prices grid */}
        <div className="ap-grid">
          <div className="ap-field">
            <label>Unit</label>
            <select
              value={selectedUnit?.name || ''}
              onChange={(e) => setUnitName(e.target.value)}
              disabled={!activeUnits.length}
            >
              {activeUnits.length === 0 && <option value="">—</option>}
              {activeUnits.map((u) => (
                <option key={u.name} value={u.name}>
                  {u.label || u.name}
                  {u.isBase ? ' (base)' : ` ×${u.conversion}`}
                </option>
              ))}
            </select>
          </div>

          <div className="ap-field">
            <label>Quantity</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="ap-field">
            <label>Buying price / unit</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="ap-field">
            <label>Selling price (optional)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Leave unchanged"
            />
          </div>
        </div>

        {/* Supplier / date */}
        <div className="ap-grid">
          <div className="ap-field">
            <label>Supplier</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Optional"
              maxLength={100}
            />
          </div>

          <div className="ap-field">
            <label>Purchase date</label>
            <input
              type="date"
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="ap-field">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Totals strip */}
      <div className="ap-totals">
        <div className="ap-total-block">
          <span>Quantity in base units</span>
          <strong>
            {quantityInBase.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
            {selectedProduct?.units?.find(u => u.isBase)?.label || ''}
          </strong>
        </div>
        <div className="ap-total-block highlight">
          <span>Total cost</span>
          <strong>{fmt(totalCost)}</strong>
        </div>
      </div>

      {/* Actions */}
      <div className="ap-actions">
        <button
          className="outline-btn"
          onClick={() => navigate('/purchases')}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="primary-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Save size={16} />
          {saving
            ? 'Saving…'
            : isEdit
            ? 'Save Changes'
            : 'Confirm Purchase'}
        </button>
      </div>

      {/* Product picker modal */}
      {pickerOpen && (
        <div className="modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select product</h3>
              <button className="close-btn" onClick={() => setPickerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="ap-picker-search">
                <Search size={16} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="ap-picker-list">
                {filteredProducts.length === 0 && (
                  <div className="ap-picker-empty">
                    <PackagePlus size={28} />
                    <p>No products found</p>
                  </div>
                )}
                {filteredProducts.map((p) => (
                  <button
                    key={p._id}
                    className="ap-picker-row"
                    onClick={() => {
                      setProductId(p._id);
                      setPickerOpen(false);
                      setProductSearch('');
                    }}
                    type="button"
                  >
                    <div>
                      <span className="picker-name">{p.name}</span>
                      <span className="picker-meta">
                        {p.category} · Stock: {p.stock ?? 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}