import { Outlet } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem, Badge } from '@mui/material';
import { Logout, Notifications } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import { useState } from 'react';
import './css/Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotifMenu = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  // Mock notifications
  const notifications = [
    { id: 1, text: 'Low stock: Laptop (3 remaining)', time: '2 min ago' },
    { id: 2, text: 'New sale: 5 items sold', time: '15 min ago' },
    { id: 3, text: 'Supplier price changed for Mouse', time: '1 hour ago' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: '#1B4D3D', boxShadow: 'none' }} className="app-bar">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            HustleGuard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.shopName}
          </Typography>
          
          {/* Notification Bell */}
          <IconButton onClick={handleNotifMenu} color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#C0392B' } }}>
              <Notifications />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            PaperProps={{
              sx: { width: 320, maxHeight: 400 }
            }}
          >
            <MenuItem disabled sx={{ fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
              Notifications
            </MenuItem>
            {notifications.length === 0 ? (
              <MenuItem disabled>No notifications</MenuItem>
            ) : (
              notifications.map((notif) => (
                <MenuItem key={notif.id} onClick={handleNotifClose} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                  <Typography variant="body2">{notif.text}</Typography>
                  <Typography variant="caption" color="text.secondary">{notif.time}</Typography>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Avatar */}
          <IconButton onClick={handleMenu} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#2D6B55' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem disabled>{user?.name}</MenuItem>
            <MenuItem onClick={() => { handleClose(); logout(); }}>
              <Logout sx={{ mr: 1 }} /> Logout
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