import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Toolbar 
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';

// Larghezza della sidebar
const drawerWidth = 240;

const Sidebar = ({ open }) => {
  const location = useLocation();
  
  // Items della sidebar
  const menuItems = [
    {
      text: 'Dashboard',
      path: '/',
      icon: <DashboardIcon />
    },
    {
      text: 'Clienti',
      path: '/clienti',
      icon: <PeopleIcon />
    },
    {
      text: 'Partner',
      path: '/partner',
      icon: <BusinessIcon />
    }
  ];

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar /> {/* Spazio per l'header */}
      <Divider />
      
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
