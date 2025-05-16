import React from "react";
import { IconType } from "react-icons";

interface UIButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: IconType;
  variant?: "primary" | "secondary" | "accent" | "subtle" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const UIButton: React.FC<UIButtonProps> = ({
  onClick,
  children,
  icon: Icon,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
  fullWidth = false,
  size = "md",
}) => {
  const baseClasses =
    "flex items-center justify-center gap-2 rounded-lg transition-all duration-300 font-medium";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg btn-glow",
    secondary:
      "bg-gray-800 hover:bg-gray-700 text-white shadow hover:shadow-md border border-gray-700/50",
    accent:
      "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg",
    subtle:
      "bg-gray-700/30 hover:bg-gray-700/50 text-gray-200 shadow hover:shadow-md",
    ghost:
      "bg-transparent hover:bg-gray-800/50 text-gray-300 hover:text-white border border-gray-700/30 hover:border-gray-600/50",
  };

  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    md: "py-3 px-6",
    lg: "py-4 px-8 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled
    ? "opacity-50 cursor-not-allowed filter grayscale"
    : "cursor-pointer hover:scale-[1.03] active:scale-[0.98]";

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
    >
      {Icon && (
        <Icon
          className={
            size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg"
          }
        />
      )}
      {children}
    </button>
  );
};

export default UIButton;
