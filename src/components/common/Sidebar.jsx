// src/components/common/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Receipt, 
  Settings, LogOut, ChevronDown, BarChart3, 
   Plus, List as ListIcon, 
  FolderOpen, CreditCard, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './css/Sidebar.module.css';

const Sidebar = ({ isMobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [productsOpen, setProductsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (isMobile && onClose) onClose();
  };

  const isProductsActive = location.pathname.startsWith('/products') || 
                          location.pathname === '/categories';

  const isReportsActive = location.pathname.startsWith('/reports') ||
                          location.pathname === '/expenses';

  return (
    <aside className={`${styles.sidebar} ${isMobile ? styles.mobile : ''}`}>
      {isMobile && <div className={styles.mobileSpacer} />}

      <nav className={styles.nav}>
        {/* Dashboard */}
        <NavLink to="/" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <LayoutDashboard size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>Dashboard</span>
        </NavLink>
        
        {/* POS */}
        <NavLink to="/pos" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <ShoppingCart size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>POS</span>
        </NavLink>

        {/* Products - Expandable */}
        <div>
          <button 
            className={`${styles.navLinkExpandable} ${isProductsActive ? styles.navLinkActive : ''}`} 
            onClick={() => setProductsOpen(!productsOpen)}
          >
            <span className={styles.navLinkExpandableLabel}>
              <Package size={16} className={styles.navIcon} /> 
              <span className={styles.navLabel}>Products</span>
            </span>
            <ChevronDown size={13} className={styles.chevron} data-open={productsOpen} />
          </button>
          {productsOpen && (
            <div className={styles.subNav}>
              <NavLink to="/products" className={({ isActive }) => `${styles.subLink} ${isActive ? styles.subLinkActive : ''}`} onClick={handleNavClick}>
                <ListIcon size={14} /> All Products
              </NavLink>
              <NavLink to="/products/add" className={({ isActive }) => `${styles.subLink} ${isActive ? styles.subLinkActive : ''}`} onClick={handleNavClick}>
                <Plus size={14} /> Add Product
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `${styles.subLink} ${isActive ? styles.subLinkActive : ''}`} onClick={handleNavClick}>
                <FolderOpen size={14} /> Categories
              </NavLink>
            </div>
          )}
        </div>
        
        {/* Sales */}
        <NavLink to="/sales" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <Receipt size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>Sales</span>
        </NavLink>

        {/* Expenses */}
        <NavLink to="/expenses" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <CreditCard size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>Expenses</span>
        </NavLink>

        {/* Reports - Simplified */}
        <div>
          <button 
            className={`${styles.navLinkExpandable} ${isReportsActive ? styles.navLinkActive : ''}`} 
            onClick={() => setReportsOpen(!reportsOpen)}
          >
            <span className={styles.navLinkExpandableLabel}>
              <BarChart3 size={16} className={styles.navIcon} /> 
              <span className={styles.navLabel}>Reports</span>
            </span>
            <ChevronDown size={13} className={styles.chevron} data-open={reportsOpen} />
          </button>
          {reportsOpen && (
            <div className={styles.subNav}>
              <NavLink to="/reports" className={({ isActive }) => `${styles.subLink} ${isActive ? styles.subLinkActive : ''}`} onClick={handleNavClick}>
                <BarChart3 size={14} /> Dashboard
              </NavLink>
            </div>
          )}
        </div>

        {/* Alerts */}
        <NavLink to="/alerts" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <AlertCircle size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>Alerts</span>
        </NavLink>
        
        {/* Settings */}
        <NavLink to="/settings" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`} onClick={handleNavClick}>
          <Settings size={16} className={styles.navIcon} /> 
          <span className={styles.navLabel}>Settings</span>
        </NavLink>
      </nav>

      <div className={styles.spacer} />

      <div className={styles.divider} />

      <button className={styles.logoutRow} onClick={handleLogout} title="Logout">
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;