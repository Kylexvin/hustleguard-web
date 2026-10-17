// src/pages/purchases/Purchases.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  PackagePlus,
  Search,
  X,
  Pencil,
  Trash2,
  Package,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import './css/Purchases.css';

const todayISO = () => new Date().toISOString().split('T')[0];
const monthStartISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split('T')[0];
};

export default function Purchases() {
  const navigate = useNavigate();

  // ---- filters ----
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(monthStartISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // ---- data ----
  const [purchases, setPurchases] = useState([]);
  const [totals, setTotals] = useState({ totalUnits: 0, totalCost: 0, count: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // ---- ui ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ============================================================
  // Load purchases
  // ============================================================
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get('/purchases', { params });
      const body = res.data || {};
      setPurchases(body.purchases || []);
      setTotals(body.totals || { totalUnits: 0, totalCost: 0, count: 0 });
      setPagination(body.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  // ============================================================
  // Delete (soft reverse)
  // ============================================================
  const handleDelete = async (purchase) => {
    const label = `${purchase.productName} · ${purchase.quantityEntered ?? purchase.quantityInBase} ${purchase.unit?.label || ''}`;
    if (!window.confirm(`Reverse this purchase?\n\n${label}\n\nStock will be reduced by ${purchase.quantityInBase} base units.`)) {
      return;
    }
    try {
      setDeletingId(purchase._id);
      await axios.delete(`/purchases/${purchase._id}`);
      toast.success('Purchase reversed');
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reverse purchase';
      toast.error(msg);
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // Client-side search (product / supplier)
  // ============================================================
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => {
      const name = (p.productName || '').toLowerCase();
      const supp = (p.supplier || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      return name.includes(q) || supp.includes(q) || notes.includes(q);
    });
  }, [purchases, search]);

  // ============================================================
  // Formatting
  // ============================================================
  const fmt = (n) => `KES ${(n || 0).toLocaleString()}`;
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };
  const unitLabel = (p) => p.unit?.label || p.unit?.name || '';

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="purchases-page">
      {/* Header */}
      <div className="purchases-header">
        <div className="header-left">
          <button className="icon-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>Purchases</h2>
            <span className="subtitle">Stock received · expense history</span>
          </div>
        </div>

        <div className="header-right">
          <button
            className="primary-btn"
            onClick={() => navigate('/purchases/add')}
          >
            <PackagePlus size={16} />
            Receive Stock
          </button>
        </div>
      </div>

      {/* Totals strip */}
      <div className="purchases-totals">
        <div className="pt-card">
          <span>Purchases</span>
          <strong>{totals.count.toLocaleString()}</strong>
        </div>
        <div className="pt-card">
          <span>Total units</span>
          <strong>
            {totals.totalUnits.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="pt-card highlight">
          <span>Total cost</span>
          <strong>{fmt(totals.totalCost)}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="purchases-filters">
        <div className="pf-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search product, supplier, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pf-dates">
          <div className="pf-field">
            <label>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="pf-field">
            <label>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="outline-btn compact"
            onClick={() => {
              setStartDate(monthStartISO());
              setEndDate(todayISO());
              setSearch('');
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="purchases-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Table / list */}
      <div className="purchases-table-wrapper">
        {loading ? (
          <div className="purchases-loading">
            <div className="spinner" />
            <p>Loading purchases…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="purchases-empty">
            <Package size={36} />
            <h3>No purchases yet</h3>
            <p>
              {search || startDate !== monthStartISO() || endDate !== todayISO()
                ? 'No purchases match your filters.'
                : 'Record your first purchase to start tracking stock-in.'}
            </p>
            <button
              className="primary-btn"
              onClick={() => navigate('/purchases/add')}
            >
              <PackagePlus size={16} />
              Receive Stock
            </button>
          </div>
        ) : (
          <table className="purchases-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th className="num">Qty</th>
                <th className="num">Buying price</th>
                <th className="num">Total cost</th>
                <th>Supplier</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
  {filtered.map((p) => (
    <tr key={p._id}>
      <td className="date-cell" data-label="Date">
        {fmtDate(p.movementDate)}
      </td>
      <td data-label="Product">
        <div className="product-cell">
          <span className="product-name">{p.productName}</span>
          {p.notes && <span className="product-notes">{p.notes}</span>}
        </div>
      </td>
      <td className="num" data-label="Qty">
        <span className="qty-value">
          {p.quantityEntered ?? p.quantityInBase}
        </span>
        <span className="qty-unit">{unitLabel(p)}</span>
      </td>
      <td className="num" data-label="Buying price">
        {fmt(p.buyingPrice)}
      </td>
      <td className="num strong" data-label="Total cost">
        {fmt((p.quantityInBase || 0) * (p.buyingPrice || 0))}
      </td>
      <td className="supplier-cell" data-label="Supplier">
        {p.supplier || '—'}
      </td>
      <td className="actions-col">
        <div className="row-actions">
          <button
            className="icon-action"
            title="Edit purchase"
            onClick={() => navigate(`/purchases/edit/${p._id}`)}
          >
            <Pencil size={14} />
          </button>
          <button
            className="icon-action danger"
            title="Reverse purchase"
            onClick={() => handleDelete(p)}
            disabled={deletingId === p._id}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="purchases-pagination">
          <button
            className="outline-btn compact"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="outline-btn compact"
            disabled={page >= pagination.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}