import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from './Pages/HomePage';
import DomainsPage from './Pages/DomainsPage';
import DomiandetailsPage from './Pages/DomiandetailsPage';
import HelpPage from './Pages/HelpPage';
import AboutusPage from './Pages/AboutusPage';
import ContactPage from './Pages/ContactPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutusPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/details" element={<DomiandetailsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;