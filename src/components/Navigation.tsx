import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from '../hooks';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/events', label: 'Events History' },
  { to: '/admin', label: 'Administration' }
];

export default function Navigation() {
  const user = useAppSelector((s) => s.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => setDrawerOpen((v) => !v);
  const handleDrawerClose = () => setDrawerOpen(false);

  const navContent = (
    <List>
      {user && navLinks.map((link) => (
        <ListItem key={link.to} disablePadding>
          <ListItemButton component={NavLink} to={link.to} onClick={handleDrawerClose} sx={{ '&.active': { bgcolor: 'primary.light' } }}>
            <ListItemText primary={link.label} />
          </ListItemButton>
        </ListItem>
      ))}
      <Divider />
      <ListItem disablePadding>
        <ListItemButton component={NavLink} to="/login" onClick={handleDrawerClose} sx={{ '&.active': { bgcolor: 'primary.light' } }}>
          <ListItemText primary={user ? 'Account' : 'Login'} />
        </ListItemButton>
      </ListItem>
      {user && (
        <>
          <Divider />
          <ListItem>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 32, height: 32 }}>{user.name?.charAt(0) || '?'}</Avatar>
              <Typography variant="body2">{user.name}</Typography>
            </Stack>
          </ListItem>
        </>
      )}
    </List>
  );

  if (isMobile) {
    return (
      <>
        <AppBar position="static" color="primary" enableColorOnDark>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              cdj-app
            </Typography>
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerClose}>
          <Box sx={{ width: 280, pt: 2 }} role="presentation">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
              <IconButton onClick={handleDrawerClose}><CloseIcon /></IconButton>
            </Box>
            {navContent}
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          cdj-app
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {user && navLinks.map((link) => (
            <Button key={link.to} component={NavLink} to={link.to} sx={{ color: 'inherit', textTransform: 'none', '&.active': { bgcolor: 'primary.dark' } }}>
              {link.label}
            </Button>
          ))}
          <Button component={NavLink} to="/login" sx={{ color: 'inherit', textTransform: 'none', '&.active': { bgcolor: 'primary.dark' } }}>{user ? 'Account' : 'Login'}</Button>
          {user && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>{user.name?.charAt(0) || '?'}</Avatar>
              <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{user.name}</Typography>
            </Stack>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
