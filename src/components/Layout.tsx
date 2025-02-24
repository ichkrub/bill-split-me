import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  buttonType?: string;
  handleStartOver?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, buttonType, handleStartOver }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* ✅ Force Full Width Navbar */}
      <nav className="w-full bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <Navbar buttonType={buttonType} handleStartOver={handleStartOver} />
        </div>
      </nav>

      {/* ✅ Ensure consistent content width */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4">{children}</main>

      {/* ✅ Footer Full Width */}
      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;