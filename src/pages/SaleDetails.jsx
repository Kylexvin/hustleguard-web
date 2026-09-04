// src/pages/SaleDetails.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Printer, 
  Receipt, 
  User, 
  Phone, 
  Calendar, 
  CreditCard,
  CheckCircle,
  Package,
  LoaderCircle,
  AlertTriangle
} from 'lucide-react';
import './css/SaleDetails.css';

export default function SaleDetails() {
  const navigate = useNavigate();
  const { invoiceNumber } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSale = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/sales/invoice/${invoiceNumber}`);
      setSale(response.data.data);
    } catch (err) {
      console.error('Error fetching sale:', err);
      setError('Sale not found. Please check the invoice number.');
    } finally {
      setLoading(false);
    }
  }, [invoiceNumber]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toFixed(2)}`;
  };

  const getUnitLabel = (item) => {
    return item.unit?.label || item.unitSold?.label || 'Unit';
  };

  const getBaseLabel = (item) => {
    if (item.unit?.isBase) return item.unit.label;
    return 'units';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="sale-details-loading">
        <LoaderCircle className="spin" size={36} />
        <p>Loading sale details...</p>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="sale-details-error">
        <AlertTriangle size={48} />
        <h2>Sale Not Found</h2>
        <p>{error || 'The sale you are looking for does not exist.'}</p>
        <button onClick={() => navigate('/sales')} className="error-btn">
          Go to Sales
        </button>
      </div>
    );
  }

  return (
    <div className="sale-details-container">
      {/* Header */}
      <div className="sale-details-header">
        <button className="sale-details-back" onClick={handleBack}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="sale-details-actions">
          <button className="sale-details-print" onClick={handlePrint}>
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="sale-details-card" id="sale-receipt">
        {/* Header */}
        <div className="sale-receipt-header">
          <div className="sale-receipt-logo">
            <Receipt size={28} />
            <span>HustleGuard</span>
          </div>
          <div className="sale-receipt-status">
            <span className={`status-badge ${sale.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
              {sale.paymentStatus === 'paid' ? (
                <><CheckCircle size={14} /> Paid</>
              ) : (
                <><AlertTriangle size={14} /> {sale.paymentStatus || 'Pending'}</>
              )}
            </span>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="sale-details-meta">
          <div className="meta-group">
            <div className="meta-item">
              <span className="meta-label">
                <Receipt size={14} /> Invoice
              </span>
              <span className="meta-value">{sale.invoiceNumber}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Calendar size={14} /> Date
              </span>
              <span className="meta-value">{formatDate(sale.saleDate)}</span>
            </div>
          </div>
          <div className="meta-group">
            <div className="meta-item">
              <span className="meta-label">
                <User size={14} /> Customer
              </span>
              <span className="meta-value">
                {sale.customer || 'Walk-in Customer'}
              </span>
            </div>
            {sale.customerPhone && (
              <div className="meta-item">
                <span className="meta-label">
                  <Phone size={14} /> Phone
                </span>
                <span className="meta-value">{sale.customerPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="sale-details-items">
          <h3>
            <Package size={16} /> Items ({sale.items?.length || 0})
          </h3>
          <table className="sale-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={index}>
                  <td className="item-name-cell">
                    <span className="item-name">{item.productName}</span>
                    <span className="item-base">({item.quantityInBase} {getBaseLabel(item)})</span>
                  </td>
                  <td className="item-unit-cell">{getUnitLabel(item)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="sale-details-totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="totals-row discount">
              <span>Discount</span>
              <span>- {formatCurrency(sale.discount)}</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="totals-row tax">
              <span>Tax ({sale.taxRate}%)</span>
              <span>{formatCurrency(sale.tax)}</span>
            </div>
          )}
          <div className="totals-row grand-total">
            <span>Total</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
          <div className="totals-row profit">
            <span>Profit</span>
            <span>{formatCurrency(sale.totalProfit || 0)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="sale-details-payment">
          <div className="payment-info-grid">
            <div className="payment-item">
              <span className="payment-icon">
                <CreditCard size={16} />
              </span>
              <div>
                <span className="payment-label">Payment Method</span>
                <span className="payment-value">{sale.paymentMethod?.toUpperCase() || 'Cash'}</span>
              </div>
            </div>
            <div className="payment-item">
              <span className="payment-icon">
                <CheckCircle size={16} />
              </span>
              <div>
                <span className="payment-label">Status</span>
                <span className={`payment-value ${sale.paymentStatus}`}>
                  {sale.paymentStatus?.toUpperCase() || 'PAID'}
                </span>
              </div>
            </div>
            <div className="payment-item">
              <span className="payment-icon">
                <Receipt size={16} />
              </span>
              <div>
                <span className="payment-label">Amount Paid</span>
                <span className="payment-value">{formatCurrency(sale.amountPaid || sale.total)}</span>
              </div>
            </div>
            {sale.changeDue > 0 && (
              <div className="payment-item">
                <span className="payment-icon">
                  <Receipt size={16} />
                </span>
                <div>
                  <span className="payment-label">Change Due</span>
                  <span className="payment-value">{formatCurrency(sale.changeDue)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="sale-details-notes">
            <span className="notes-label">Notes</span>
            <p>{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="sale-receipt-footer">
          <p>Thank you for your business!</p>
          <span>Generated on {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}