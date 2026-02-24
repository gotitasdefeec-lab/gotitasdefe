import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './index.css';
import App from './App';
import theme from './theme';
import reportWebVitals from './reportWebVitals';
import { initializeAuth } from './services/authService';
import { pushNotificationService } from './services/pushNotificationService';

// Initialize authentication state
initializeAuth();

// Initialize push notifications after a short delay to avoid blocking initial render
setTimeout(() => {
  pushNotificationService.initialize().catch((error) => {
    console.error('Failed to initialize push notifications:', error);
  });
}, 1000);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
