import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faPrint,
  faCheckCircle,
  faExclamationTriangle,
  faBox,
  faArrowLeft,
  faPlus,
  faFileExport,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../css/StockReport.css';

export default function StockReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');


  useEffect(() => {
    if (id) {
      fetchReport(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    setWeekStart(start.toISOString().split('T')[0]);
    setWeekEnd(end.toISOString().split('T')[0]);
  }, []);

  const fetchReport = async (reportId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/reports/stock/weekly/${reportId}`);
      setReport(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!weekStart || !weekEnd) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const response = await axios.post('/reports/stock/weekly', {
        weekStartDate: new Date(weekStart),
        weekEndDate: new Date(weekEnd)
      });
      setReport(response.data.data);
      navigate(`/reports/stock/${response.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const finalizeReport = async () => {
    if (!report) return;
    try {
      const response = await axios.put(`/reports/stock/weekly/${report._id}/finalize`);
      setReport(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize report');
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  const getVarianceBadge = (variance) => {
    if (variance > 0) return <span className="badge over">+{variance}</span>;
    if (variance < 0) return <span className="badge under">{variance}</span>;
    return <span className="badge match">0</span>;
  };



  if (loading) {
    return (
      <div className="stock-report-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading report...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="stock-report-error">
        <FontAwesomeIcon icon={faExclamationTriangle} />
        <p>{error}</p>
        <button onClick={() => navigate('/reports')} className="btn-primary">
          Back to Reports
        </button>
      </div>
    );
  }

  // Generate Report Form
  if (!id && !report) {
    return (
      <div className="stock-report-generate">
        <button className="back-btn" onClick={() => navigate('/reports')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        
        <div className="stock-report-header">
          <h2>Generate Weekly Stock Report</h2>
          <p>Select the week range to generate a new stock report</p>
        </div>

        <div className="generate-form">
          <div className="form-group">
            <label>Week Start Date</label>
            <input 
              type="date" 
              value={weekStart} 
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Week End Date</label>
            <input 
              type="date" 
              value={weekEnd} 
              onChange={(e) => setWeekEnd(e.target.value)}
            />
          </div>
          <button 
            onClick={generateReport} 
            disabled={generating}
            className="btn-generate"
          >
            {generating ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Generating...</>
            ) : (
              <><FontAwesomeIcon icon={faPlus} /> Generate Report</>
            )}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  // View Existing Report
  return (
    <div className="stock-report-view">
      {/* Header */}
      <div className="stock-report-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/reports')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h2>Weekly Stock Report</h2>
            <div className="report-meta">
              <span>Week {report.weekNumber}, {report.year}</span>
              <span className="meta-separator">|</span>
              <span>
                {new Date(report.weekStartDate).toLocaleDateString()} - {new Date(report.weekEndDate).toLocaleDateString()}
              </span>
              <span className="meta-separator">|</span>
              <span className={`status-badge ${report.status}`}>{report.status}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {report.status !== 'finalized' && (
            <button onClick={finalizeReport} className="btn-success">
              <FontAwesomeIcon icon={faCheckCircle} /> Finalize
            </button>
          )}
          <button className="btn-outline">
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          <button className="btn-outline">
            <FontAwesomeIcon icon={faFileExport} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary-cards">
        <div className="summary-card">
          <div className="summary-label">Opening Stock Value</div>
          <div className="summary-value">{formatCurrency(report.summary?.totalOpeningValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Received</div>
          <div className="summary-value">{formatCurrency(report.summary?.totalReceivedValue)}</div>
        </div>
        <div className="summary-card highlight">
          <div className="summary-label">Sold</div>
          <div className="summary-value">{formatCurrency(report.summary?.totalSoldValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Closing Stock Value</div>
          <div className="summary-value">{formatCurrency(report.summary?.totalClosingValue)}</div>
        </div>
      </div>

      {/* Variance Summary */}
      <div className="variance-summary">
        <h3>
          <FontAwesomeIcon icon={faExclamationTriangle} /> Stock Variance
        </h3>
        <div className="variance-cards">
          <div className="variance-card over">
            <span>Over</span>
            <strong>{formatCurrency(report.summary?.totalOverVariance || 0)}</strong>
          </div>
          <div className="variance-card under">
            <span>Under</span>
            <strong>{formatCurrency(Math.abs(report.summary?.totalUnderVariance || 0))}</strong>
          </div>
          <div className="variance-card total">
            <span>Total Variance</span>
            <strong>{formatCurrency(report.summary?.totalVarianceValue || 0)}</strong>
          </div>
          <div className="variance-card items">
            <span>Items with Variance</span>
            <strong>{report.summary?.itemsWithVariance || 0}</strong>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="report-items">
        <div className="items-header">
          <h3><FontAwesomeIcon icon={faBox} /> Product Details</h3>
          <div className="items-search">
            <FontAwesomeIcon icon={faSearch} />
            <input type="text" placeholder="Search products..." />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Opening</th>
                <th className="num">Received</th>
                <th className="num">Sold</th>
                <th className="num">Closing</th>
                <th className="num">Physical</th>
                <th className="num">Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.items?.map((item) => (
                <tr key={item.productId} className={item.variance !== 0 ? 'has-variance' : ''}>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">{item.productName}</span>
                      <span className="product-unit">{item.unit?.label || 'Unit'}</span>
                      {item.category && (
                        <span className="product-category">{item.category}</span>
                      )}
                    </div>
                  </td>
                  <td className="num">{Math.round(item.openingQuantity * 100) / 100}</td>
                  <td className="num">{Math.round(item.quantityReceived * 100) / 100}</td>
                  <td className="num highlight">{Math.round(item.quantitySold * 100) / 100}</td>
                  <td className="num strong">{Math.round(item.closingQuantity * 100) / 100}</td>
                  <td className="num">
                    {item.hasPhysicalCount ? Math.round(item.physicalCount * 100) / 100 : '-'}
                  </td>
                  <td className="num variance-cell">
                    {item.variance !== 0 ? Math.round(item.variance * 100) / 100 : '0'}
                    {getVarianceBadge(item.variance)}
                  </td>
                  <td>
                    <span className={`stock-status ${item.closingQuantity <= 0 ? 'out' : item.closingQuantity <= 10 ? 'low' : 'in'}`}>
                      {item.closingQuantity <= 0 ? 'Out' : item.closingQuantity <= 10 ? 'Low' : 'In'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profit Summary */}
      {report.profit && (
        <div className="profit-summary">
          <h3>Profit Summary</h3>
          <div className="profit-grid">
            <div className="profit-item">
              <span>Total Sales</span>
              <strong>{formatCurrency(report.profit.totalSales)}</strong>
            </div>
            <div className="profit-item">
              <span>Cost of Goods Sold</span>
              <strong>{formatCurrency(report.profit.totalCostOfGoodsSold)}</strong>
            </div>
            <div className="profit-item highlight">
              <span>Gross Profit</span>
              <strong>{formatCurrency(report.profit.grossProfit)}</strong>
              <span className="profit-margin">({report.profit.grossProfitMargin?.toFixed(1)}%)</span>
            </div>
            <div className="profit-item">
              <span>Total Expenses</span>
              <strong>{formatCurrency(report.profit.totalExpenses || 0)}</strong>
            </div>
            <div className="profit-item highlight green">
              <span>Net Profit</span>
              <strong>{formatCurrency(report.profit.netProfit)}</strong>
              <span className="profit-margin">({report.profit.netProfitMargin?.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}