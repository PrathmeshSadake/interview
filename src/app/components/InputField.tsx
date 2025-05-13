import React from 'react';
import { IconType } from 'react-icons';

interface InputFieldProps {
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  label?: string;
  placeholder?: string;
  icon?: IconType;
  required?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  label,
  placeholder,
  icon: Icon,
  required = false,
  className = '',
  multiline = false,
  rows = 3
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="text-gray-400 text-lg" />
          </div>
        )}
        
        {multiline ? (
          <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            required={required}
            placeholder={placeholder}
            className={`w-full bg-gray-800/50 border border-gray-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
              Icon ? 'pl-10' : ''
            }`}
          />
        ) : (
          <input
            id={id}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className={`w-full bg-gray-800/50 border border-transparent rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              Icon ? 'pl-10' : ''
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default InputField; 