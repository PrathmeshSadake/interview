"use client";
import { useState } from 'react';
import Card from './Card';
import InputField from './InputField';
import UIButton from './UIButton';
import { FiUser, FiBriefcase, FiCalendar, FiInfo, FiEdit2 } from 'react-icons/fi';

interface InterviewFormProps {
  onSubmit: (formData: {
    name: string;
    position: string;
    experience: string;
    additionalInfo: string;
  }) => void;
  isMinimized?: boolean;
  userInfo?: {
    name: string;
    position: string;
    experience: string;
    additionalInfo: string;
  } | null;
}

export default function InterviewForm({ onSubmit, isMinimized = false, userInfo }: InterviewFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    experience: '',
    additionalInfo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Show a different view when minimized and we have user info
  if (isMinimized && userInfo) {
    return (
      <Card className="w-full" variant="glassmorphic">
        <div className="border-b border-gray-800 pb-3 mb-3">
          <h3 className="text-white font-medium">Interview Details</h3>
        </div>
        
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-400">Name</p>
            <p className="text-white font-medium">{userInfo.name}</p>
          </div>
          
          <div>
            <p className="text-gray-400">Position</p>
            <p className="text-white font-medium">{userInfo.position}</p>
          </div>
          
          <div>
            <p className="text-gray-400">Experience</p>
            <p className="text-white font-medium">{userInfo.experience}</p>
          </div>
          
          {userInfo.additionalInfo && (
            <div>
              <p className="text-gray-400">Additional Info</p>
              <p className="text-gray-300 text-xs">{userInfo.additionalInfo}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" variant="glassmorphic">
      <div className="mb-5 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-semibold text-white mb-2">Interview Information</h2>
        <p className="text-gray-400">Please provide your details to begin the AI interview</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name field - full width */}
        <InputField
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          label="Full Name"
          placeholder="Enter your full name"
          icon={FiUser}
          required
          className="mb-1"
        />
        
        {/* Position and Experience on the same line for larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            label="Position Applied For"
            placeholder="Enter the position"
            icon={FiBriefcase}
            required
          />
          
          <InputField
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            label="Years of Experience"
            placeholder="e.g., 5 years"
            icon={FiCalendar}
            required
          />
        </div>
        
        <div>
          <div className="flex justify-between items-end">
            <InputField
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              label="Additional Information"
              placeholder="Any other relevant details for the interviewer"
              icon={FiInfo}
              multiline
              rows={3}
              className="flex-1 mr-4"
            />

            <UIButton 
              type="submit"
              onClick={() => {}}
              className="px-8 py-3 min-w-[120px] self-end"
            >
              Start
            </UIButton>
          </div>
        </div>
      </form>
    </Card>
  );
} 