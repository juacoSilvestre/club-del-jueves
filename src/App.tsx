import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import EventsHistory from './pages/EventsHistory';
import Login from './pages/Login';
import { useAppSelector } from './hooks';
import { Typography} from '@mui/material';
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
      <Navigation />

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
