import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientiPage from './pages/ClientiPage';
import PartnerPage from './pages/PartnerPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clienti" element={<ClientiPage />} />
        <Route path="/partner" element={<PartnerPage />} />
      </Routes>
    </Layout>
  );
}

export default App;