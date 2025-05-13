import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glassmorphic';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default'
}) => {
  const variantClasses = {
    default: "bg-gray-900 border border-gray-800",
    glassmorphic: "bg-gray-900/60 backdrop-blur-md border border-gray-800/50"
  };

  return (
    <div className={`rounded-xl shadow-lg p-6 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card; 