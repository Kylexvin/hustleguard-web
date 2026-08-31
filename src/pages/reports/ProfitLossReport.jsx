import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faDownload, 
  faPrint,
  faChartLine,
  faArrowLeft,
  faCoins,
  faMoneyBillWave,
  faShoppingCart,
  faFileExport,
  faChevronDown,
  faChevronUp,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import '../css/ProfitLossReport.css';

export default function ProfitLossReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profitData, setProfitData] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Removed: showDetails, setShowDetails - not used
  const [expensesExpanded, setExpensesExpanded] = useState(false);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchProfitData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchProfitData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/reports/profit/weekly', {
        weekStartDate: new Date(startDate),
        weekEndDate: new Date(endDate)
      });
      setProfitData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profit data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  // Removed: formatDate - not used
  // Removed: getProfitIcon - not used

  const getProfitColor = (amount) => {
    if (amount > 0) return '#10b981';
    if (amount < 0) return '#ef4444';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div className="profit-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading profit data...</p>
      </div>
    );
  }

  return (
    <div className="profit-container">
      {/* Header */}
      <div className="profit-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/reports')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h2>Profit & Loss Report</h2>
            <p>Sales → COGS → Gross Profit → Expenses → Net Profit</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={fetchProfitData}>
            <FontAwesomeIcon icon={faDownload} /> Refresh
          </button>
          <button className="btn-outline">
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          <button className="btn-outline">
            <FontAwesomeIcon icon={faFileExport} /> Export
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="profit-date-range">
        <div className="date-group">
          <label>Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-group">
          <label>End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={fetchProfitData}>
          Update Report
        </button>
      </div>

      {error && (
        <div className="profit-error">
          <p>{error}</p>
          <button onClick={fetchProfitData} className="btn-primary">Retry</button>
        </div>
      )}

      {profitData && (
        <>
          {/* Summary Cards */}
          <div className="profit-summary-cards">
            <div className="summary-card">
              <div className="summary-icon" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Total Sales</span>
                <span className="summary-value">{formatCurrency(profitData.sales?.total)}</span>
                <span className="summary-sub">{profitData.sales?.count || 0} transactions</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                <FontAwesomeIcon icon={faCoins} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Cost of Goods Sold</span>
                <span className="summary-value">{formatCurrency(profitData.costOfGoodsSold)}</span>
                <span className="summary-sub">{profitData.sales?.count || 0} items sold</span>
              </div>
            </div>
            <div className="summary-card highlight">
              <div className="summary-icon" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Gross Profit</span>
                <span className="summary-value" style={{ color: getProfitColor(profitData.profit?.grossProfit) }}>
                  {formatCurrency(profitData.profit?.grossProfit)}
                </span>
                <span className="summary-sub">
                  Margin: {profitData.profit?.grossProfitMargin?.toFixed(1)}%
                  {profitData.profit?.grossProfit > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} style={{ color: '#10b981', marginLeft: 4 }} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} style={{ color: '#ef4444', marginLeft: 4 }} />
                  )}
                </span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Total Expenses</span>
                <span className="summary-value">{formatCurrency(profitData.expenses?.total)}</span>
                <span className="summary-sub">{profitData.expenses?.count || 0} expenses</span>
              </div>
            </div>
            <div className="summary-card highlight green">
              <div className="summary-icon" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="summary-content">
                <span className="summary-label">Net Profit</span>
                <span className="summary-value" style={{ color: getProfitColor(profitData.profit?.netProfit) }}>
                  {formatCurrency(profitData.profit?.netProfit)}
                </span>
                <span className="summary-sub">
                  Margin: {profitData.profit?.netProfitMargin?.toFixed(1)}%
                  {profitData.profit?.netProfit > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} style={{ color: '#10b981', marginLeft: 4 }} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} style={{ color: '#ef4444', marginLeft: 4 }} />
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Profit Flow */}
          <div className="profit-flow">
            <h3>Profit Flow</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="flow-label">Sales Revenue</div>
                <div className="flow-value">{formatCurrency(profitData.sales?.total)}</div>
                <div className="flow-arrow">↓</div>
              </div>
              <div className="flow-step">
                <div className="flow-label">Less: COGS</div>
                <div className="flow-value negative">- {formatCurrency(profitData.costOfGoodsSold)}</div>
                <div className="flow-arrow">↓</div>
              </div>
              <div className="flow-step highlight">
                <div className="flow-label">= Gross Profit</div>
                <div className="flow-value" style={{ color: getProfitColor(profitData.profit?.grossProfit) }}>
                  {formatCurrency(profitData.profit?.grossProfit)}
                </div>
                <div className="flow-arrow">↓</div>
              </div>
              <div className="flow-step">
                <div className="flow-label">Less: Expenses</div>
                <div className="flow-value negative">- {formatCurrency(profitData.expenses?.total)}</div>
                <div className="flow-arrow">↓</div>
              </div>
              <div className="flow-step highlight final">
                <div className="flow-label">= Net Profit</div>
                <div className="flow-value" style={{ color: getProfitColor(profitData.profit?.netProfit) }}>
                  {formatCurrency(profitData.profit?.netProfit)}
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Breakdown */}
          <div className="expenses-breakdown">
            <div className="breakdown-header" onClick={() => setExpensesExpanded(!expensesExpanded)}>
              <h3>
                <FontAwesomeIcon icon={faMoneyBillWave} /> Expenses by Category
              </h3>
              <button>
                <FontAwesomeIcon icon={expensesExpanded ? faChevronUp : faChevronDown} />
              </button>
            </div>
            {expensesExpanded && (
              <div className="breakdown-content">
                {profitData.expenses?.byCategory && Object.keys(profitData.expenses.byCategory).length > 0 ? (
                  <div className="category-list">
                    {Object.entries(profitData.expenses.byCategory).map(([category, amount]) => (
                      <div key={category} className="category-item">
                        <span className="category-name">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                        <div className="category-bar">
                          <div 
                            className="category-bar-fill" 
                            style={{ 
                              width: `${(amount / profitData.expenses.total) * 100}%`,
                              backgroundColor: '#1B4D3D'
                            }}
                          />
                        </div>
                        <span className="category-amount">{formatCurrency(amount)}</span>
                        <span className="category-percent">
                          {((amount / profitData.expenses.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-expenses">No expenses recorded in this period</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="profit-quick-stats">
            <div className="quick-stat">
              <span>Average Sale Value</span>
              <strong>{formatCurrency(profitData.sales?.average || 0)}</strong>
            </div>
            <div className="quick-stat">
              <span>Profit per Sale</span>
              <strong>{formatCurrency(profitData.profit?.profitPerSale || 0)}</strong>
            </div>
            <div className="quick-stat">
              <span>Total Revenue</span>
              <strong>{formatCurrency(profitData.sales?.total || 0)}</strong>
            </div>
            <div className="quick-stat">
              <span>Total Costs</span>
              <strong>{formatCurrency((profitData.costOfGoodsSold || 0) + (profitData.expenses?.total || 0))}</strong>
            </div>
          </div>
        </>
      )}
    </div>
  );
}