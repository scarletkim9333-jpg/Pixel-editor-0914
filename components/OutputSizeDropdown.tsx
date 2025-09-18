import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';
import type { AspectRatio } from '../types';

interface OutputSizeOption {
  value: AspectRatio;
  label: string;
  icon: string;
}

interface OutputSizeDropdownProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
  model?: string;
}

const OUTPUT_SIZE_OPTIONS: OutputSizeOption[] = [
  { value: 'auto', label: 'Auto (Default)', icon: '⬜' },
  { value: '1:1', label: 'Square (1:1)', icon: '◻️' },
  { value: '4:3', label: 'Classic (4:3)', icon: '📺' },
  { value: '16:9', label: 'Widescreen (16:9)', icon: '🖥️' },
  { value: '3:4', label: 'Portrait (3:4)', icon: '📱' },
  { value: '9:16', label: 'Mobile (9:16)', icon: '📲' }
];

export const OutputSizeDropdown: React.FC<OutputSizeDropdownProps> = ({
  value,
  onChange,
  disabled = false,
  model = 'nanobanana'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = OUTPUT_SIZE_OPTIONS.find(option => option.value === value) || OUTPUT_SIZE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionSelect = (option: OutputSizeOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 border-2 border-black bg-[#FFFBF2] hover:bg-gray-50 transition-colors text-left flex justify-between items-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'ring-2 ring-black' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{selectedOption.icon}</span>
          <span className="font-medium text-black font-neodgm">{selectedOption.label}</span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-black bg-[#FFFBF2] shadow-[3px_3px_0_0_#000] z-10 max-h-60 overflow-y-auto">
          {OUTPUT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionSelect(option)}
              className={`w-full p-3 text-left flex items-center gap-3 transition-colors hover:bg-gray-100 ${
                option.value === value ? 'bg-[#a4d8d2] font-semibold' : ''
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="font-neodgm">{option.label}</span>
              {option.value !== 'auto' && model === 'nanobanana' && (
                <span className="ml-auto text-sm text-gray-600">+2 토큰</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};