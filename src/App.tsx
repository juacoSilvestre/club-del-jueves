import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppBar, Box, Container, Toolbar, Typography, Button, Stack, Avatar } from '@mui/material';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import EventsHistory from './pages/EventsHistory';
import Login from './pages/Login';
import { useAppSelector } from './hooks';

function App() {
  const user = useAppSelector((state) => state.auth.user);

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const location = useLocation();
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            cdj-app
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {user &&
              [
                { to: '/', label: 'Home' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/events', label: 'Events History' },
                { to: '/admin', label: 'Administration' }
              ].map((link) => (
                <Button
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  sx={{
                    color: 'inherit',
                    textTransform: 'none',
                    '&.active': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {link.label}
                </Button>
              ))}
            <Button
              component={NavLink}
              to="/login"
              sx={{
                color: 'inherit',
                textTransform: 'none',
                '&.active': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              {user ? 'Account' : 'Login'}
            </Button>
            {user && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 1 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  {user.name}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Routes>
          <Route
            path="/"
            element={(
              <RequireAuth>
                <Home />
              </RequireAuth>
            )}
          />
          <Route
            path="/events"
            element={(
              <RequireAuth>
                <EventsHistory />
              </RequireAuth>
            )}
          />
          <Route
            path="/dashboard"
            element={(
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            )}
          />
          <Route
            path="/admin"
            element={(
              <RequireAuth>
                <Administration />
              </RequireAuth>
            )}
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary">
          Club Del Jueves APP. Clarita la cuenta
        </Typography>
      </Box>
    </Box>
  );
}

export default App;
