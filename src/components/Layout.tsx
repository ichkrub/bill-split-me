import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  buttonType?: string;
  handleStartOver?: () => void; // ✅ Pass handleStartOver as a prop
}

const Layout: React.FC<LayoutProps> = ({ children, buttonType, handleStartOver }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar buttonType={buttonType} handleStartOver={handleStartOver} /> {/* ✅ Pass to Navbar */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;