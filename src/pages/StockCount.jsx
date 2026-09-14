// src/pages/StockCount.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ClipboardCheck,
  Save,
  Plus,
  Minus,
  X,
  Package,
  AlertCircle,
  Search,
  Check, 
} from 'lucide-react';
import './css/StockCount.css';

const ADJUSTMENT_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost / Missing' },
  { value: 'personal', label: 'Personal / Owner Use' },
  { value: 'other', label: 'Other' }
];

export default function StockCount() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(today);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [resuming, setResuming] = useState(false);

  // Per-product counting UI state
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // ============================================================
  // Load existing draft on mount
  // ============================================================
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/stock-counts/latest-draft');
        const existing = res.data.data;
        if (existing) {
          setDraft(existing);
          setPeriodStart(existing.periodStart?.slice(0, 10) || today);
          setPeriodEnd(existing.periodEnd?.slice(0, 10) || today);
          setResuming(true);
        }
      } catch (err) {
        if (err.response?.status !== 404) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  // ============================================================
  // Start a new draft
  // ============================================================
  const startCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/stock-counts/draft', { periodStart, periodEnd });
      setDraft(res.data.data);
      setResuming(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Discard draft
  // ============================================================
  const discardDraft = async () => {
    if (!draft) return;
    if (!window.confirm('Discard this draft? Any counts you entered will be lost.')) return;
    try {
      setSaving(true);
      await axios.delete(`/stock-counts/${draft._id}`);
      setDraft(null);
      setResuming(false);
      setPeriodStart(today);
      setPeriodEnd(today);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to discard');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Save a single product's count
  // ============================================================
  const saveItemCount = async (productId, physicalStock, adjustments) => {
    if (!draft) return;
    try {
      setSaving(true);
      const res = await axios.post(`/stock-counts/${draft._id}/count-item`, {
        productId,
        physicalStock,
        adjustments: adjustments || []
      });
      setDraft(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save count');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Confirm the whole count
  // ============================================================
  const confirmCount = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      await axios.post(`/stock-counts/${draft._id}/confirm`);
      navigate('/stock-monitor');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Derived data
  // ============================================================
  const items = useMemo(() => draft?.items || [], [draft?.items]);

  const countedItems = useMemo(
    () => items.filter(i => i.physicalStock !== null && i.physicalStock !== undefined),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      (i.baseUnitLabel || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const reviewTotals = useMemo(() => {
    return countedItems.reduce((acc, it) => {
      const sold = it.estimatedSold || 0;
      const pos = it.posRecordedQty || 0;
      acc.estimated += sold;
      acc.pos += pos;
      acc.unrecorded += Math.max(0, sold - pos);
      acc.revenue += it.estimatedRevenue || 0;
      acc.profit += it.estimatedProfit || 0;
      return acc;
    }, { estimated: 0, pos: 0, unrecorded: 0, revenue: 0, profit: 0 });
  }, [countedItems]);

  const fmt = (n) => `KES ${(n || 0).toLocaleString()}`;

  // ============================================================
  // Per-item counting — open the panel for a product
  // ============================================================
  const openCounter = (item) => {
    setSelectedItem(item);
    setInputValue(
      item.physicalStock !== null && item.physicalStock !== undefined
        ? String(item.physicalStock)
        : ''
    );
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeCounter = () => {
    setSelectedItem(null);
    setInputValue('');
  };

  const submitCurrent = async () => {
    if (!selectedItem) return;
    const val = Number(inputValue);
    if (isNaN(val) || val < 0) {
      alert('Enter a valid non-negative number');
      return;
    }
    await saveItemCount(selectedItem.productId, val, selectedItem.adjustments || []);
    closeCounter();
  };

  // ============================================================
  // Loading
  // ============================================================
  if (loading) {
    return (
      <div className="stock-count-loading">
        <div className="spinner"></div>
        <p>Loading…</p>
      </div>
    );
  }

  // ============================================================
  // REVIEW MODE
  // ============================================================
  if (draft && reviewMode) {
    return (
      <div className="stock-count">
        <div className="stock-count-header">
          <div className="header-left">
            <button className="icon-back-btn" onClick={() => setReviewMode(false)}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2>Review & Confirm</h2>
              <span className="subtitle">Check before saving</span>
            </div>
          </div>
        </div>

        <div className="review-panel">
          <div className="review-header">
            <h3>Reconciliation Summary</h3>
            <span className="period-pill">
              {draft.periodStart?.slice(0, 10)} → {draft.periodEnd?.slice(0, 10)}
            </span>
          </div>

          <div className="review-grid">
            <div className="review-card">
              <span>Products counted</span>
              <strong>{countedItems.length} / {items.length}</strong>
            </div>
            <div className="review-card">
              <span>Estimated sold</span>
              <strong>{reviewTotals.estimated}</strong>
            </div>
            <div className="review-card">
              <span>POS recorded</span>
              <strong>{reviewTotals.pos}</strong>
            </div>
            <div className="review-card">
              <span>Unrecorded</span>
              <strong>{reviewTotals.unrecorded}</strong>
            </div>
            <div className="review-card">
              <span>Sales value</span>
              <strong>{fmt(reviewTotals.revenue)}</strong>
            </div>
            <div className="review-card highlight">
              <span>Estimated profit</span>
              <strong>{fmt(reviewTotals.profit)}</strong>
            </div>
          </div>

          {countedItems.length < items.length && (
            <div className="review-note">
              <AlertCircle size={16} />
              <span>
                {items.length - countedItems.length} product(s) were not counted. Confirming will
                leave their current stock unchanged but they won't be part of this reconciliation.
              </span>
            </div>
          )}

          <div className="review-actions">
            <button className="outline-btn" onClick={() => setReviewMode(false)}>
              Keep counting
            </button>
            <button className="primary-btn" onClick={confirmCount} disabled={saving}>
              <ClipboardCheck size={18} />
              {saving ? 'Confirming…' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================
  return (
    <div className="stock-count">
      {/* Header */}
      <div className="stock-count-header">
        <div className="header-left">
          <button className="icon-back-btn" onClick={() => navigate('/stock-monitor')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>Stock Count</h2>
            <span className="subtitle">Count products one by one</span>
          </div>
        </div>

        {draft && (
          <div className="header-right">
            <span className="status-pill draft">
              <AlertCircle size={12} />
              DRAFT
            </span>
            <span className="period-pill">
              {draft.periodStart?.slice(0, 10)} → {draft.periodEnd?.slice(0, 10)}
            </span>
          </div>
        )}
      </div>

      {/* Resume banner */}
      {draft && resuming && (
        <div className="resume-banner">
          <div className="resume-left">
            <AlertCircle size={18} />
            <div>
              <strong>Resuming an unfinished count</strong>
              <span>Continue where you left off, or discard to start fresh.</span>
            </div>
          </div>
          <button className="discard-btn" onClick={discardDraft}>
            Discard draft
          </button>
        </div>
      )}

      {/* Period picker */}
      {!draft && (
        <div className="period-card">
          <div className="period-card-title">
            <ClipboardCheck size={18} />
            <span>Choose reconciliation period</span>
          </div>

          <div className="period-row">
            <div className="field">
              <label>Start</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="field">
              <label>End</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <button
            className="primary-btn full"
            onClick={startCount}
            disabled={loading || !periodStart || !periodEnd}
          >
            {loading ? 'Starting…' : 'Begin Count'}
          </button>

          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {/* Counting screen */}
      {draft && (
        <>
          {/* Progress strip */}
          <div className="count-progress">
            <span className="progress-count">
              <strong>{countedItems.length}</strong> of {items.length} products counted
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: items.length > 0
                    ? `${(countedItems.length / items.length) * 100}%`
                    : '0%'
                }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="stock-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search product to count…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Product list */}
          <div className="product-list-wrapper">
            {filteredItems.length === 0 && (
              <div className="empty-state">
                <Package size={32} />
                <p>No products found</p>
              </div>
            )}

            {filteredItems.map(it => {
              const counted = it.physicalStock !== null && it.physicalStock !== undefined;
              const hasDiff = counted && it.physicalStock !== it.expectedStock;

              return (
                <button
                  key={it.productId}
                  className={`product-row ${counted ? 'counted' : ''} ${hasDiff ? 'diff' : ''}`}
                  onClick={() => openCounter(it)}
                >
                  <div className="product-info">
                    <span className="product-name">{it.productName}</span>
                    <span className="product-meta">
                      Expected: {it.expectedStock} {it.baseUnitLabel}
                      {it.posRecordedQty > 0 && ` · POS today: ${it.posRecordedQty}`}
                    </span>
                  </div>

                  <div className="product-right">
                    {counted ? (
                      <>
                        <span className="counted-value">
                          <Check size={14} /> {it.physicalStock}
                        </span>
                        {hasDiff && (
                          <span className="diff-badge">
                            {it.physicalStock > it.expectedStock ? '+' : ''}
                            {it.physicalStock - it.expectedStock}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="count-cta">Count →</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm bar */}
          <div className="confirm-bar">
            <div className="confirm-info">
              <strong>Finished counting?</strong>
              <span>
                {countedItems.length} of {items.length} products counted
              </span>
            </div>
            <div className="confirm-actions">
              <button className="outline-btn" onClick={() => navigate('/stock-monitor')}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={() => setReviewMode(true)}
                disabled={saving || countedItems.length === 0}
              >
                <ClipboardCheck size={18} />
                Review Summary
              </button>
            </div>
          </div>
        </>
      )}

      {/* Counter modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeCounter}>
          <div className="modal-content counter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.productName}</h3>
              <button className="close-btn" onClick={closeCounter}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="counter-meta">
                <span>Expected: <strong>{selectedItem.expectedStock}</strong> {selectedItem.baseUnitLabel}</span>
                {selectedItem.posRecordedQty > 0 && (
                  <span>POS today: <strong>{selectedItem.posRecordedQty}</strong></span>
                )}
              </div>

              <label className="counter-label">How many on the shelf?</label>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                className="counter-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCurrent();
                }}
                placeholder="0"
              />

              {selectedItem.adjustments?.length > 0 && (
                <div className="counter-adjustments">
                  Adjustments:{' '}
                  {selectedItem.adjustments.map(a => `${a.quantity} ${a.reason}`).join(', ')}
                </div>
              )}

              <button
                className="add-line-btn"
                onClick={() =>
                  setAdjustModal({
                    productId: selectedItem.productId,
                    item: selectedItem,
                    keepCounterOpen: true
                  })
                }
              >
                <Plus size={16} /> Add adjustment
              </button>
            </div>

            <div className="modal-footer">
              <button className="outline-btn" onClick={closeCounter}>Cancel</button>
              <button className="primary-btn" onClick={submitCurrent} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving…' : 'Save count'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustments modal */}
      {adjustModal && (
        <AdjustmentModal
          item={adjustModal.item}
          onClose={() => setAdjustModal(null)}
          onSave={async (adjustments) => {
            const val = Number(inputValue);
            const physical = isNaN(val) ? 0 : val;
            await saveItemCount(adjustModal.productId, physical, adjustments);
            setAdjustModal(null);
            if (adjustModal.keepCounterOpen) {
              const updated = draft.items.find(
                i => i.productId === adjustModal.productId
              );
              if (updated) setSelectedItem(updated);
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Adjustment Modal
// ============================================================
function AdjustmentModal({ item, onClose, onSave }) {
  const [lines, setLines] = useState(
    item.adjustments?.length > 0
      ? item.adjustments.map(a => ({ reason: a.reason, quantity: a.quantity }))
      : [{ reason: 'damaged', quantity: 0 }]
  );

  const addLine = () => setLines([...lines, { reason: 'damaged', quantity: 0 }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) =>
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleSave = () => {
    const cleaned = lines
      .filter(l => Number(l.quantity) > 0)
      .map(l => ({ reason: l.reason, quantity: Number(l.quantity) }));
    onSave(cleaned);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adjustments — {item.productName}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-hint">
            Subtract stock that left the shop but was <strong>not sold</strong>.
          </p>

          {lines.map((line, idx) => (
            <div key={idx} className="adj-row">
              <select
                value={line.reason}
                onChange={(e) => updateLine(idx, { reason: e.target.value })}
              >
                {ADJUSTMENT_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                value={line.quantity}
                onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                min="0"
              />
              <button className="icon-btn" onClick={() => removeLine(idx)}>
                <Minus size={16} />
              </button>
            </div>
          ))}

          <button className="add-line-btn" onClick={addLine}>
            <Plus size={16} /> Add adjustment
          </button>
        </div>

        <div className="modal-footer">
          <button className="outline-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={handleSave}>
            <Save size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}