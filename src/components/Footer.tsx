import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-2">
          <p className="text-gray-500 text-sm">
            © 2025 <a href="https://www.smbee.me" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SMBee</a>. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm text-gray-500 hover:text-primary hover:underline">
              Blog
            </Link>
            <Link to="/how-it-works" className="text-sm text-gray-500 hover:text-primary hover:underline">
              How It Works
            </Link>
            <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;