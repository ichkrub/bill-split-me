import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Scissors } from 'lucide-react';

interface NavbarProps {
  buttonType?: string;
  handleStartOver?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ buttonType, handleStartOver }) => {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 w-full">
      <div className="w-full max-w-6xl mx-auto px-4 py-3"> {/* Updated to max-w-6xl */}
        <div className="flex items-center justify-between">
          {/* ✅ Fix Missing Icon */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/favicon.svg" alt="BillSplit Icon" className="h-6 w-6" /> {/* ✅ Load from public folder */}
            <h1 className="text-xl font-semibold">BillSplit Me</h1>
          </Link>

          {/* ✅ Restore "Start Over" button */}
          {buttonType === 'start-over' ? (
            <button
              onClick={handleStartOver}
              className="btn btn-secondary flex items-center gap-1"
            >
              <RotateCcw size={16} />
              <span>Start Over</span>
            </button>
          ) : (
            <Link to="/" className="btn btn-primary flex items-center gap-1">
              <Scissors size={16} /> {/* ✂️ Icon for splitting */}
              <span>Start Splitting</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;