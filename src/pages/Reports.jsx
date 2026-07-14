import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import './css/Reports.css';

export default function Reports() {
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <button className="reports-download-btn">
          <FontAwesomeIcon icon={faDownload} /> Export
        </button>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-card-icon">📊</div>
          <h3>Sales Report</h3>
          <p>Daily, weekly, monthly sales summary</p>
          <button className="report-btn">View Report</button>
        </div>

        <div className="report-card">
          <div className="report-card-icon">📦</div>
          <h3>Inventory Report</h3>
          <p>Stock levels, low stock items, valuation</p>
          <button className="report-btn">View Report</button>
        </div>

        <div className="report-card">
          <div className="report-card-icon">💰</div>
          <h3>Profit Report</h3>
          <p>Profit margins, top products, revenue</p>
          <button className="report-btn">View Report</button>
        </div>

        <div className="report-card">
          <div className="report-card-icon">👥</div>
          <h3>Customer Report</h3>
          <p>Top customers, purchase history, trends</p>
          <button className="report-btn">View Report</button>
        </div>
      </div>
    </div>
  );
}