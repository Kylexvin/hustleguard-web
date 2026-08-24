// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import './css/NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-number">404</div>
        <h1>Page Not Found</h1>
        <p>
          The page you are looking for might have been removed, 
          had its name changed, or is temporarily unavailable.
        </p>
        <div className="not-found-actions">
          <button onClick={() => navigate('/')} className="not-found-btn primary">
            <Home size={18} /> Go Home
          </button>
          <button onClick={() => navigate(-1)} className="not-found-btn secondary">
            <Search size={18} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}