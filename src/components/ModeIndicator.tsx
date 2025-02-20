import React from 'react';
import { UserCheck, Users } from 'lucide-react';
import { SplitMode } from '../types';

interface ModeIndicatorProps {
  mode: SplitMode;
  onReset: () => void;
}

export function ModeIndicator({ mode, onReset }: ModeIndicatorProps) {
  if (!mode) return null;

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[61px] z-10">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {mode === 'manual' ? (
                <UserCheck className="w-4 h-4 text-primary" />
              ) : (
                <Users className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <div className="font-medium">
                {mode === 'manual' ? 'Manual Mode' : 'Shared Mode'}
              </div>
              <div className="text-xs text-gray-500">
                {mode === 'manual' 
                  ? 'Assign items to people yourself'
                  : 'Let people claim their own items'}
              </div>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-primary"
          >
            Change Mode
          </button>
        </div>
      </div>
    </div>
  );
}