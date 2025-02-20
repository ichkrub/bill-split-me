import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function CookieConsent({ onAccept, onDecline }: CookieConsentProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm text-white z-50 p-4 shadow-lg">
      <div className="max-w-screen-lg mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-center sm:text-left">
          We use cookies to personalize content, serve ads, and analyze traffic. By clicking "Accept", you consent to our use of cookies. See our{' '}
          <Link 
            to="/privacy-policy" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-light underline"
          >
            Privacy Policy
          </Link>
          {' '}to learn more.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onDecline}
            className="btn btn-secondary text-sm min-w-[100px]"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="btn btn-primary text-sm min-w-[100px]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}