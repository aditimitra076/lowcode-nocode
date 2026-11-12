import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Page imports
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Marketplace from './pages/Marketplace.jsx';

// Browser Router
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <NotFound />,
  },
  {
    path: '/login',
    element: <AuthPage initialTab="login" />,
  },
  {
    path: '/signin',
    element: <AuthPage initialTab="login" />,
  },
  {
    path: '/register',
    element: <AuthPage initialTab="register" />,
  },
  {
    path: '/signup',
    element: <AuthPage initialTab="register" />,
  },
  {
    path: '/auth',
    element: <AuthPage initialTab="login" />,
  },
  {
    path: '/auth/:type',
    element: <AuthPage />,
  },
  {
    path: '/marketplace',
    element: <Marketplace />,
  },
  {
    path: '/dashboard',
    element: <Home />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
