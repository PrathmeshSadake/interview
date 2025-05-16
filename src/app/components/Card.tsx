import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glassmorphic" | "elevated" | "gradient";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const variantClasses = {
    default: "bg-gray-900 border border-gray-800",
    glassmorphic: "glassmorphic", // Using the custom class from globals.css
    elevated: "bg-gray-900/80 border border-gray-800/70 shadow-xl",
    gradient: "gradient-animate border border-indigo-800/20",
  };

  return (
    <div
      className={`rounded-xl p-6 ${variantClasses[variant]} transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
