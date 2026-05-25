import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Admin from './Admin.jsx';
import './styles.css';

const root = createRoot(document.getElementById('root'));
const isAdminRoute = window.location.pathname.startsWith('/admin');

root.render(isAdminRoute ? <Admin /> : <App />);
