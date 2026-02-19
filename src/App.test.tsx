import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';
import { theme } from './theme';
import { ThemeProvider } from '@mui/material/styles';

const renderWithProviders = () =>
  render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );

test('renders navigation links', () => {
  renderWithProviders();
  expect(screen.getByText(/Home/i)).toBeInTheDocument();
  expect(screen.getByText(/Administration/i)).toBeInTheDocument();
});
