import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PresentationPage from './components/PresentationPage';
import './styles/global.css';

const isPresentation = window.location.hash.startsWith('#/presentation') || window.location.search.includes('presentation');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPresentation ? <PresentationPage /> : <App />}
  </React.StrictMode>
);

