import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { PrivacyPolicy } from './components/PrivacyPolicy.tsx';
import { HowItWorksPage } from './components/HowItWorksPage.tsx';
import { ParticipantView } from './components/ParticipantView.tsx';
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
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>
);