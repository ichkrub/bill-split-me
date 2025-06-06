import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { PrivacyPolicy } from './pages/PrivacyPolicy.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { ParticipantView } from './pages/ParticipantView.tsx';
import BlogPage from './pages/blog/index.tsx';  // Updated import path
import BlogPostPage from './pages/blog/[slug].tsx';  // Updated import path
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/privacy-policy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/how-it-works',
    element: <HowItWorksPage />,
  },
  {
    path: '/split/:billId',
    element: <ParticipantView />,
    errorElement: <ParticipantView />
  },
  {
    path: '*',
    element: <ParticipantView />
  },
  {
    path: '/blog',
    element: <BlogPage />,
  },
  {
    path: '/blog/:slug',
    element: <BlogPostPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>
);