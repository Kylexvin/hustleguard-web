import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faDownload, 
  faArrowLeft,
  faChartLine,
  faFileExport,
  faArrowUp,
  faArrowDown,
  faMinus,
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import '../css/TrendsReport.css';

export default function TrendsReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [weeks, setWeeks] = useState(12);
  const [activeDataset, setActiveDataset] = useState('sales');

  useEffect(() => {
    fetchTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, weeks]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/reports/profit/trends', {
        params: { period, weeks }
      });
      setTrends(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `KES ${(amount || 0).toLocaleString()}`;

  const getMaxValue = (data) => {
    if (!data || data.length === 0) return 1000;
    const max = Math.max(...data);
    return max * 1.2;
  };

  const getMinValue = (data) => {
    if (!data || data.length === 0) return 0;
    const min = Math.min(...data);
    return min * 0.8;
  };

  const getTrendColor = (data) => {
    if (!data || data.length < 2) return '#6b7280';
    const last = data[data.length - 1];
    const previous = data[data.length - 2];
    if (last > previous) return '#10b981';
    if (last < previous) return '#ef4444';
    return '#f59e0b';
  };

  const getTrendIcon = (data) => {
    if (!data || data.length < 2) return faMinus;
    const last = data[data.length - 1];
    const previous = data[data.length - 2];
    if (last > previous) return faArrowUp;
    if (last < previous) return faArrowDown;
    return faMinus;
  };

  const getPercentageChange = (data) => {
    if (!data || data.length < 2) return 0;
    const last = data[data.length - 1];
    const previous = data[data.length - 2];
    if (previous === 0) return 0;
    return ((last - previous) / previous) * 100;
  };

  const datasets = [
    { id: 'sales', label: 'Sales', color: '#1B4D3D', data: trends?.datasets?.sales || [] },
    { id: 'grossProfit', label: 'Gross Profit', color: '#3B82F6', data: trends?.datasets?.grossProfit || [] },
    { id: 'netProfit', label: 'Net Profit', color: '#10b981', data: trends?.datasets?.netProfit || [] },
    { id: 'expenses', label: 'Expenses', color: '#ef4444', data: trends?.datasets?.expenses || [] }
  ];

  const activeData = datasets.find(d => d.id === activeDataset);
  const maxValue = getMaxValue(activeData?.data || []);
  const minValue = getMinValue(activeData?.data || []);
  const range = maxValue - minValue || 1;
  const percentageChange = getPercentageChange(activeData?.data || []);
  const trendIcon = getTrendIcon(activeData?.data || []);
  const trendColor = getTrendColor(activeData?.data || []);

  // Generate SVG path for line chart
  const generateLinePath = (data, width, height, padding) => {
    if (!data || data.length < 2) return '';
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    });
    
    return points.join(' ');
  };

  // Generate area path (filled area under line)
  const generateAreaPath = (data, width, height, padding) => {
    if (!data || data.length < 2) return '';
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    });
    
    // Close the path: go to bottom right, bottom left, then back to start
    const lastX = padding + chartWidth;
    const firstX = padding;
    const bottomY = padding + chartHeight;
    
    return `${points.join(' ')} ${lastX},${bottomY} ${firstX},${bottomY}`;
  };

  if (loading) {
    return (
      <div className="trends-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading trends...</p>
      </div>
    );
  }

  return (
    <div className="trends-container">
      {/* Header */}
      <div className="trends-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/reports')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <div>
            <h2>Trends</h2>
            <p>Weekly/monthly sales and profit trends</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-outline" onClick={fetchTrends}>
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

      {/* Controls */}
      <div className="trends-controls">
        <div className="control-group">
          <label>Period</label>
          <div className="btn-group">
            <button 
              className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
        <div className="control-group">
          <label>Weeks/Months</label>
          <div className="btn-group">
            {[6, 12, 24].map((num) => (
              <button 
                key={num}
                className={`period-btn ${weeks === num ? 'active' : ''}`}
                onClick={() => setWeeks(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <label>Data View</label>
          <div className="btn-group">
            {datasets.map((d) => (
              <button 
                key={d.id}
                className={`dataset-btn ${activeDataset === d.id ? 'active' : ''}`}
                onClick={() => setActiveDataset(d.id)}
                style={{ 
                  borderColor: activeDataset === d.id ? d.color : '#d1d5db',
                  backgroundColor: activeDataset === d.id ? d.color + '15' : 'transparent'
                }}
              >
                <span className="dataset-dot" style={{ backgroundColor: d.color }} />
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="trends-error">
          <p>{error}</p>
          <button onClick={fetchTrends} className="btn-primary">Retry</button>
        </div>
      )}

      {trends && (
        <>
          {/* Trend Summary */}
          <div className="trend-summary">
            <div className="trend-summary-card">
              <div className="trend-summary-label">{activeData?.label}</div>
              <div className="trend-summary-value">
                {formatCurrency(activeData?.data?.[activeData.data.length - 1] || 0)}
              </div>
              <div className="trend-summary-change" style={{ color: trendColor }}>
                <FontAwesomeIcon icon={trendIcon} />
                {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}% vs previous
              </div>
            </div>
            <div className="trend-summary-card">
              <div className="trend-summary-label">Average</div>
              <div className="trend-summary-value">
                {formatCurrency(activeData?.data?.reduce((a, b) => a + b, 0) / (activeData?.data?.length || 1) || 0)}
              </div>
              <div className="trend-summary-change">Over {activeData?.data?.length || 0} periods</div>
            </div>
            <div className="trend-summary-card">
              <div className="trend-summary-label">Highest</div>
              <div className="trend-summary-value" style={{ color: '#10b981' }}>
                {formatCurrency(Math.max(...(activeData?.data || []), 0))}
              </div>
              <div className="trend-summary-change">Peak performance</div>
            </div>
            <div className="trend-summary-card">
              <div className="trend-summary-label">Lowest</div>
              <div className="trend-summary-value" style={{ color: '#ef4444' }}>
                {formatCurrency(Math.min(...(activeData?.data || []), 0))}
              </div>
              <div className="trend-summary-change">Lowest point</div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="trend-chart">
            <div className="chart-header">
              <h3>
                <FontAwesomeIcon icon={faChartLine} /> {activeData?.label} Trend
              </h3>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: activeData?.color }} />
                  {activeData?.label}
                </span>
              </div>
            </div>
            <div className="chart-container">
              <svg 
                width="100%" 
                height="100%" 
                viewBox="0 0 800 300" 
                preserveAspectRatio="xMidYMid meet"
                className="trend-svg"
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 30 + (1 - ratio) * 240;
                  const value = minValue + ratio * range;
                  return (
                    <g key={ratio}>
                      <line
                        x1="50"
                        y1={y}
                        x2="780"
                        y2={y}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x="45"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#6b7280"
                      >
                        {formatCurrency(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                {activeData?.data && activeData.data.length > 1 && (
                  <polygon
                    points={generateAreaPath(activeData.data, 800, 300, 50)}
                    fill={activeData.color + '30'}
                    stroke="none"
                  />
                )}

                {/* Line */}
                {activeData?.data && activeData.data.length > 1 && (
                  <polyline
                    points={generateLinePath(activeData.data, 800, 300, 50)}
                    fill="none"
                    stroke={activeData.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data points */}
                {activeData?.data && activeData.data.map((value, index) => {
                  const chartWidth = 800 - 100;
                  const chartHeight = 300 - 60;
                  const x = 50 + (index / (activeData.data.length - 1)) * chartWidth;
                  const y = 30 + chartHeight - ((value - minValue) / range) * chartHeight;
                  const isLast = index === activeData.data.length - 1;
                  
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isLast ? 6 : 4}
                        fill={isLast ? activeData.color : 'white'}
                        stroke={activeData.color}
                        strokeWidth={isLast ? 3 : 2}
                      >
                        <title>{`${trends.labels[index]}: ${formatCurrency(value)}`}</title>
                      </circle>
                      {isLast && (
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill="none"
                          stroke={activeData.color}
                          strokeWidth="2"
                          opacity="0.3"
                        />
                      )}
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {trends?.labels && trends.labels.map((label, index) => {
                  const chartWidth = 800 - 100;
                  const x = 50 + (index / (trends.labels.length - 1)) * chartWidth;
                  return (
                    <text
                      key={index}
                      x={x}
                      y={285}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6b7280"
                      transform={trends.labels.length > 8 ? `rotate(-30, ${x}, 285)` : ''}
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* All Datasets Comparison */}
          <div className="trend-comparison">
            <h3>All Metrics Comparison</h3>
            <div className="comparison-grid">
              {datasets.map((d) => {
                const data = d.data || [];
                const lastValue = data[data.length - 1] || 0;
                const avg = data.reduce((a, b) => a + b, 0) / (data.length || 1);
                const change = data.length > 1 ? ((data[data.length - 1] - data[data.length - 2]) / (data[data.length - 2] || 1)) * 100 : 0;
                
                return (
                  <div key={d.id} className="comparison-item">
                    <div className="comparison-header">
                      <span className="comparison-dot" style={{ backgroundColor: d.color }} />
                      <span className="comparison-label">{d.label}</span>
                    </div>
                    <div className="comparison-value">{formatCurrency(lastValue)}</div>
                    <div className="comparison-stats">
                      <span>Avg: {formatCurrency(avg)}</span>
                      <span className={`comparison-change ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Table */}
          <div className="trend-data-table">
            <h3>Detailed Data</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Period</th>
                    {datasets.map((d) => (
                      <th key={d.id} style={{ color: d.color }}>{d.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trends?.labels?.map((label, index) => (
                    <tr key={index}>
                      <td className="period-label">{label}</td>
                      {datasets.map((d) => (
                        <td key={d.id} className="period-value">
                          {formatCurrency(d.data?.[index] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}