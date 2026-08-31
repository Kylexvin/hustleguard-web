import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Collapse } from '@mui/material';
import { 
  Dashboard, 
  Inventory, 
  Receipt, 
  Notifications, 
  Settings, 
  ExpandLess, 
  ExpandMore, 
  Add, 
  List as ListIcon,
  PointOfSale,
  Label,
  Assessment,
  ShowChart,
  MoneyOff,
  Checklist,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import './css/Sidebar.css';

const drawerWidth = 240;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openProducts, setOpenProducts] = useState(false);
  const [openReports, setOpenReports] = useState(false);

  const handleProductsClick = () => {
    setOpenProducts(!openProducts);
  };

  const handleReportsClick = () => {
    setOpenReports(!openReports);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1B4D3D', color: '#fff' },
      }}
      className="sidebar"
    >
      <Toolbar />
      <List>
        {/* Dashboard */}
        <ListItem
          onClick={() => navigate('/')}
          sx={{
            cursor: 'pointer',
            bgcolor: isActive('/') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: isActive('/') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Dashboard />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            primaryTypographyProps={{
              fontWeight: isActive('/') ? 'bold' : 'normal',
              color: isActive('/') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
        </ListItem>

        {/* POS */}
        <ListItem
          onClick={() => navigate('/pos')}
          sx={{
            cursor: 'pointer',
            bgcolor: isActive('/pos') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: isActive('/pos') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <PointOfSale />
          </ListItemIcon>
          <ListItemText 
            primary="POS" 
            primaryTypographyProps={{
              fontWeight: isActive('/pos') ? 'bold' : 'normal',
              color: isActive('/pos') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
        </ListItem>

        {/* Products with Dropdown */}
        <ListItem
          onClick={handleProductsClick}
          sx={{
            cursor: 'pointer',
            bgcolor: location.pathname.startsWith('/products') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: location.pathname.startsWith('/products') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Inventory />
          </ListItemIcon>
          <ListItemText 
            primary="Products" 
            primaryTypographyProps={{
              fontWeight: location.pathname.startsWith('/products') ? 'bold' : 'normal',
              color: location.pathname.startsWith('/products') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
          {openProducts ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />}
        </ListItem>
        <Collapse in={openProducts} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem
              onClick={() => navigate('/products')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: isActive('/products') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: isActive('/products') ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <ListIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="All Products" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: isActive('/products') ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/products/add')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: isActive('/products/add') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: isActive('/products/add') ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Add Product" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: isActive('/products/add') ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/categories')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: isActive('/categories') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: isActive('/categories') ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <Label fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Categories" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: isActive('/categories') ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
          </List>
        </Collapse>

        {/* Sales */}
        <ListItem
          onClick={() => navigate('/sales')}
          sx={{
            cursor: 'pointer',
            bgcolor: isActive('/sales') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: isActive('/sales') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Receipt />
          </ListItemIcon>
          <ListItemText 
            primary="Sales" 
            primaryTypographyProps={{
              fontWeight: isActive('/sales') ? 'bold' : 'normal',
              color: isActive('/sales') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
        </ListItem>

        {/* Reports with Dropdown */}
        <ListItem
          onClick={handleReportsClick}
          sx={{
            cursor: 'pointer',
            bgcolor: location.pathname.startsWith('/reports') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: location.pathname.startsWith('/reports') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Assessment />
          </ListItemIcon>
          <ListItemText 
            primary="Reports" 
            primaryTypographyProps={{
              fontWeight: location.pathname.startsWith('/reports') ? 'bold' : 'normal',
              color: location.pathname.startsWith('/reports') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
          {openReports ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.7)' }} />}
        </ListItem>
        <Collapse in={openReports} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem
              onClick={() => navigate('/reports')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: isActive('/reports') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: isActive('/reports') ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <Assessment fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Reports Dashboard" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: isActive('/reports') ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/reports/stock')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: location.pathname === '/reports/stock' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/reports/stock' ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <Inventory fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Stock Report" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: location.pathname === '/reports/stock' ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/reports/profit')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: location.pathname === '/reports/profit' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/reports/profit' ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Profit & Loss" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: location.pathname === '/reports/profit' ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/reports/expenses')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: location.pathname === '/reports/expenses' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/reports/expenses' ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <MoneyOff fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Expenses" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: location.pathname === '/reports/expenses' ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/reports/physical-count')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: location.pathname === '/reports/physical-count' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/reports/physical-count' ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <Checklist fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Physical Count" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: location.pathname === '/reports/physical-count' ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
            <ListItem
              onClick={() => navigate('/reports/trends')}
              sx={{
                pl: 4,
                cursor: 'pointer',
                bgcolor: location.pathname === '/reports/trends' ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/reports/trends' ? '#fff' : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                <TrendingUp fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Trends" 
                primaryTypographyProps={{
                  fontSize: 14,
                  color: location.pathname === '/reports/trends' ? '#fff' : 'rgba(255,255,255,0.6)',
                }}
              />
            </ListItem>
          </List>
        </Collapse>

        {/* Alerts */}
        <ListItem
          onClick={() => navigate('/alerts')}
          sx={{
            cursor: 'pointer',
            bgcolor: isActive('/alerts') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: isActive('/alerts') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Notifications />
          </ListItemIcon>
          <ListItemText 
            primary="Alerts" 
            primaryTypographyProps={{
              fontWeight: isActive('/alerts') ? 'bold' : 'normal',
              color: isActive('/alerts') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
        </ListItem>

        {/* Settings */}
        <ListItem
          onClick={() => navigate('/settings')}
          sx={{
            cursor: 'pointer',
            bgcolor: isActive('/settings') ? 'rgba(255,255,255,0.15)' : 'transparent',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
          }}
        >
          <ListItemIcon sx={{ color: isActive('/settings') ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            <Settings />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{
              fontWeight: isActive('/settings') ? 'bold' : 'normal',
              color: isActive('/settings') ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          />
        </ListItem>
      </List>
    </Drawer>
  );
}