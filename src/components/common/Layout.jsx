// src/components/common/Layout.jsx
import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Badge } from '@mui/material';
import { Logout, Notifications } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotifMenu = (event) => {
    setNotifAnchorEl(event.currentTarget);
    // Mark notifications as read when opened
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };
  const handleNotifClose = () => setNotifAnchorEl(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/alerts/unread/count');
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/alerts?limit=5');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n._id);
      
      if (unreadIds.length === 0) return;

      // Mark as read (you might need a bulk update endpoint)
      // For now, we'll just update the local state and refetch
      await axios.put('/alerts/mark-read', { alertIds: unreadIds });
      setUnreadCount(0);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when menu opens
  useEffect(() => {
    if (notifAnchorEl) {
      fetchNotifications();
    }
  }, [notifAnchorEl]);

  // Navigate to alerts page
  const handleViewAll = () => {
    handleNotifClose();
    navigate('/alerts');
  };


  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📌';
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: '#1B4D3D', boxShadow: 'none' }} className="app-bar">
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            HustleGuard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }}>
            {user?.shopName}
          </Typography>
          
          {/* Notification Bell */}
          <IconButton 
            onClick={handleNotifMenu} 
            color="inherit" 
            sx={{ 
              mr: 1,
              position: 'relative',
              '& .MuiBadge-badge': {
                bgcolor: '#C0392B',
                fontSize: '10px',
                height: '18px',
                minWidth: '18px',
                padding: '0 4px',
                top: '2px',
                right: '2px'
              }
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              invisible={unreadCount === 0}
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#C0392B',
                  fontSize: '10px',
                  height: '18px',
                  minWidth: '18px',
                  padding: '0 4px',
                  top: '2px',
                  right: '2px'
                }
              }}
            >
              <Notifications sx={{ fontSize: 24 }} />
            </Badge>
          </IconButton>
          
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            PaperProps={{
              sx: { 
                width: 360, 
                maxHeight: 400,
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }
            }}
          >
            <MenuItem 
              disabled 
              sx={{ 
                fontWeight: 'bold', 
                borderBottom: '1px solid #eee',
                py: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>
                  {unreadCount} unread
                </span>
              )}
            </MenuItem>
            
            {loading ? (
              <MenuItem disabled sx={{ justifyContent: 'center', py: 3 }}>
                Loading...
              </MenuItem>
            ) : notifications.length === 0 ? (
              <MenuItem disabled sx={{ justifyContent: 'center', py: 3, color: '#999' }}>
                No notifications
              </MenuItem>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <MenuItem 
                  key={notif._id} 
                  onClick={handleNotifClose}
                  sx={{ 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    py: 1.5,
                    borderBottom: '1px solid #f5f5f5',
                    bgcolor: notif.isRead ? 'transparent' : '#F0F7F4',
                    '&:hover': {
                      bgcolor: '#E8F1EC'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <span style={{ fontSize: '14px' }}>{getSeverityIcon(notif.severity)}</span>
                    <Typography variant="body2" sx={{ fontWeight: notif.isRead ? 'normal' : '600', flex: 1 }}>
                      {notif.title}
                    </Typography>
                    {!notif.isRead && (
                      <span style={{ 
                        fontSize: '8px', 
                        bgcolor: '#C0392B', 
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        NEW
                      </span>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 3.5 }}>
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 3.5, fontSize: '10px' }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </Typography>
                </MenuItem>
              ))
            )}
            
            <MenuItem 
              onClick={handleViewAll}
              sx={{ 
                justifyContent: 'center', 
                borderTop: '1px solid #eee',
                color: '#1B4D3D',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#E8F1EC'
                }
              }}
            >
              View All Alerts
            </MenuItem>
          </Menu>

          {/* User Avatar */}
          <IconButton onClick={handleMenu} color="inherit" sx={{ ml: 0.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#2D6B55' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu 
            anchorEl={anchorEl} 
            open={Boolean(anchorEl)} 
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                minWidth: 160
              }
            }}
          >
            <MenuItem disabled sx={{ fontWeight: 600, color: '#1B4D3D' }}>
              {user?.name}
            </MenuItem>
            <MenuItem disabled sx={{ fontSize: '12px', color: '#999', pt: 0 }}>
              {user?.email}
            </MenuItem>
            <MenuItem 
              onClick={() => { handleClose(); logout(); }}
              sx={{ 
                borderTop: '1px solid #eee',
                color: '#C0392B',
                '&:hover': {
                  bgcolor: '#FBEAE5'
                }
              }}
            >
              <Logout sx={{ mr: 1, fontSize: 18 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Sidebar />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  );
}