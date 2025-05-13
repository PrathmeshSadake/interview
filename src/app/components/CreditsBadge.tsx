import React from 'react';
import { RiCoinLine } from 'react-icons/ri';

interface CreditsBadgeProps {
  credits: number;
  className?: string;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ credits, className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 bg-gray-800/80 rounded-lg px-3 py-1.5 text-sm text-yellow-400 ${className}`}>
      <RiCoinLine className="text-yellow-400" />
      <span>{credits} credit{credits !== 1 ? 's' : ''} needed</span>
    </div>
  );
};

export default CreditsBadge; 