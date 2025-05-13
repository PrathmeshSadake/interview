import React from 'react';
import { IconType } from 'react-icons';

interface UIButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: IconType;
  variant?: 'primary' | 'secondary' | 'subtle';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const UIButton: React.FC<UIButtonProps> = ({ 
  onClick, 
  children, 
  icon: Icon, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false
}) => {
  const baseClasses = "flex items-center justify-center gap-2 rounded-lg transition-all duration-200 font-medium";
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white py-3 px-6",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white py-3 px-6",
    subtle: "bg-gray-700/30 hover:bg-gray-700/50 text-gray-200 py-2 px-4"
  };
  
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
    >
      {Icon && <Icon className="text-lg" />}
      {children}
    </button>
  );
};

export default UIButton; 