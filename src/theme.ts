import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#9c27b0'
    },
    background: {
      default: '#f4f6fb',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif'
  },
  shape: {
    borderRadius: 10
  }
});
