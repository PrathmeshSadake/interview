import React from 'react';
import { HiClock } from 'react-icons/hi';
import { FiChevronDown } from 'react-icons/fi';

interface DurationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  value,
  onChange,
  options,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };
  
  const selectedOption = options.find(option => option.value === value);
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/50 rounded-lg py-2 px-3 text-gray-300 hover:bg-gray-700/80 transition-colors"
      >
        <HiClock className="text-gray-400" />
        <span>{selectedOption?.label || 'Select duration'}</span>
        <FiChevronDown className={`ml-1 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    option.value === value ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DurationSelector; 