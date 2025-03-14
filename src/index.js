import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// Utilizzo di ReactDOM.render invece di createRoot
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);