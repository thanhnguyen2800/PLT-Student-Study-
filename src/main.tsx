import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupClientApiInterceptor } from './lib/apiFallback';

// Activate client API interceptor so deployed versions (Vercel, Netlify, Cloud Run) never fail API calls
setupClientApiInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
